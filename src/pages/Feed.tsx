"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bell, Bookmark, Sparkles, Loader2, Trash2, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton, PostSkeleton, StorySkeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { useInfinitePosts } from '@/hooks/use-infinite-posts';
import { apiService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import ImageCropper from '@/components/ImageCropper';
import SEO from '@/components/SEO';
import { getAvatarUrl } from '@/utils/avatar';

const compressImage = (base64: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8)); // 0.8 quality
    };
  });
};

const StoryViewer = ({ stories, user, onClose, primaryColor }: {
  stories: any[];
  user: { name: string; handle: string; avatar?: string };
  onClose: () => void;
  primaryColor: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setProgress(p => Math.min(100, p + 1.5));
    }, 60);
    return () => clearInterval(timer);
  }, [currentIndex, isPaused]);

  useEffect(() => {
    if (progress >= 100) {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(i => i + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
  }, [progress, currentIndex, stories.length, onClose]);

  const currentStory = stories[currentIndex];

  if (!stories || stories.length === 0 || !currentStory) return null;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 150) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden select-none"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          key={currentStory.id + '-bg'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8 }}
          src={currentStory.image} 
          className="w-full h-full object-cover blur-[120px] scale-150" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full">
        {/* Progress Bars */}
        <div className="flex gap-1.5 px-4 pt-6">
          {stories.map((_, i) => (
            <div key={i} className="h-1 bg-white/10 flex-1 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div 
                className="h-full bg-white"
                initial={false}
                animate={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  opacity: i === currentIndex ? 1 : 0.4
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-[2.5px] rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500">
              <Avatar className="w-10 h-10 border-2 border-black rounded-[14px]">
                <AvatarImage src={getAvatarUrl(user.avatar, user.handle)} />
                <AvatarFallback className="bg-gray-800 text-white font-black">{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm tracking-tight drop-shadow-md">{user.name}</span>
              <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">
                {formatTime(currentStory.created_at)}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-xl border border-white/10 active:scale-90"
          >
            <Plus className="rotate-45" size={26} />
          </button>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 relative flex items-center justify-center px-4 pb-24"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, scale: 0.92, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.05, rotateY: -15 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img 
                src={currentStory.image} 
                alt="Story" 
                className="max-h-full max-w-full rounded-[2.5rem] object-contain shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-white/5"
              />
              <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] pointer-events-none" />
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation zones */}
          <div className="absolute inset-0 flex">
            <div 
              className="w-1/3 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); currentIndex > 0 && (setCurrentIndex(i => i - 1), setProgress(0)); }} 
            />
            <div 
              className="flex-1 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); currentIndex < stories.length - 1 ? (setCurrentIndex(i => i + 1), setProgress(0)) : onClose(); }} 
            />
          </div>
        </div>

        {/* Bottom Hint */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-1 opacity-30"
          >
            <div className="w-8 h-1 bg-white rounded-full" />
            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Glisser pour fermer</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const StoriesBar = ({ users, stories, currentUser, primaryColor, onStoryClick, onAddStory }: {
  users: any[];
  stories: any[];
  currentUser: any;
  primaryColor: string;
  onStoryClick: (handle: string) => void;
  onAddStory: () => void;
}) => {
  const usersWithStories = users.filter(u => stories.some(s => s.user_handle === u.handle));
  const iHaveStories = stories.some(s => s.user_handle === currentUser.handle);
  const isGuest = currentUser.isGuest;

  return (
    <div className="flex gap-5 overflow-x-auto no-scrollbar px-6 py-4">
      {/* Add Story — membres connectés uniquement */}
      {!isGuest && (
        <div className="flex flex-col items-center gap-2.5 min-w-[65px]">
          <div
            onClick={onAddStory}
            className="w-16 h-16 rounded-[24px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 cursor-pointer tap-scale group hover:border-indigo-400 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Plus size={20} className="text-gray-900 dark:text-white" />
            </div>
          </div>
          <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Partager</span>
        </div>
      )}

      {/* My Story */}
      {iHaveStories && (
        <div 
          className="flex flex-col items-center gap-2.5 min-w-[65px] cursor-pointer group"
          onClick={() => onStoryClick(currentUser.handle)}
        >
          <div className="p-[3px] rounded-[26px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-gradient-xy">
            <div className="p-[2px] rounded-[23px] bg-white dark:bg-[hsl(224,20%,7%)]">
              <Avatar className="w-14 h-14 rounded-[21px] border border-gray-100 dark:border-white/5">
                <AvatarImage src={getAvatarUrl(currentUser.avatarImage, currentUser.handle)} className="object-cover" />
                <AvatarFallback className="font-black">{currentUser.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Moi</span>
        </div>
      )}

      {/* Others' Stories */}
      {usersWithStories.filter(u => u.handle !== currentUser.handle).map((u, i) => (
        <motion.div
          key={u.id}
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-2.5 min-w-[65px] cursor-pointer group"
          onClick={() => onStoryClick(u.handle)}
        >
          <div className="p-[3px] rounded-[26px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="p-[2px] rounded-[23px] bg-white dark:bg-[hsl(224,20%,7%)]">
              <div className="w-14 h-14 rounded-[21px] overflow-hidden border border-gray-100 dark:border-white/5">
                <img
                  src={getAvatarUrl(u.avatarImage, u.handle)}
                  alt={u.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate w-16 text-center">
            {u.handle.replace('@', '')}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

const Feed = () => {
  const navigate = useNavigate();
  const { likedPosts, favoritePosts, toggleLike, toggleFavoritePost, toggleFollow, user, primaryColor, users, deletePost } = useApp();
  const [showHeart, setShowHeart] = useState<number | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { posts, loadMore, hasMore, isLoading, removePost, updatePostLikes } = useInfinitePosts();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleLike = async (postId: number) => {
    const isLiked = likedPosts.includes(postId);
    await toggleLike(postId);
    updatePostLikes(postId, isLiked ? -1 : 1);
  };

  const fetchStories = useCallback(async () => {
    try {
      const data = await apiService.getStories();
      if (Array.isArray(data)) setStories(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setCroppingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const confirmUploadStory = async () => {
    if (!previewImage || isUploading) return;
    setIsUploading(true);
    try {
      await apiService.addStory(previewImage);
      showSuccess("Story publiée ! ✨");
      setPreviewImage(null);
      fetchStories();
    } catch (err: any) {
      showError(err.message || "Impossible de publier la story.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId);
      removePost(postId);
      showSuccess("Post supprimé. 🗑️");
    } catch {
      showError("Impossible de supprimer ce post.");
    }
  };

  useEffect(() => {
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleDoubleTap = (postId: number) => {
    if (!likedPosts.includes(postId)) handleToggleLike(postId);
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 800);
  };

  const approvedUsers = users.filter(u => u.isApproved && u.handle !== user.handle);

  return (
    <MainLayout>
      <SEO title="Flux d'Art" description="Découvrez les dernières créations de la communauté Chibi Vulture." />
      {/* Hidden file input for stories */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleAddStory}
      />

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {croppingImage && (
          <ImageCropper 
            image={croppingImage}
            aspectRatio={9/16}
            onCancel={() => setCroppingImage(null)}
            onCrop={async (cropped) => {
              const compressed = await compressImage(cropped);
              setPreviewImage(compressed);
              setCroppingImage(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Story Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl border border-white/10">
              <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-0 right-0 px-6 flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold h-12"
                  onClick={() => setPreviewImage(null)}
                  disabled={isUploading}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 rounded-2xl font-bold h-12 shadow-lg shadow-pink-500/20"
                  style={{ backgroundColor: primaryColor }}
                  onClick={confirmUploadStory}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : 'Publier ✨'}
                </Button>
              </div>
            </div>
            <p className="mt-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">Aperçu de la story</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {viewingUser && (
          <StoryViewer 
            user={viewingUser}
            stories={stories.filter(s => s.user_handle === viewingUser.handle)}
            onClose={() => setViewingUser(null)}
            primaryColor={primaryColor}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={12} style={{ color: primaryColor }} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Communauté</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Pour toi</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm text-gray-400 hover:text-gray-900 dark:hover:text-white"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
        </Button>
      </header>

      {/* Stories */}
      <div className="mb-6">
        <StoriesBar
          users={users}
          stories={stories}
          currentUser={user}
          primaryColor={primaryColor}
          onAddStory={() => fileInputRef.current?.click()}
          onStoryClick={(handle) => {
            if (handle === user.handle) {
              setViewingUser({
                name: user.name,
                handle: user.handle,
                avatar: getAvatarUrl(user.avatarImage, user.handle)
              });
            } else {
              const found = users.find(u => u.handle === handle);
              if (found) setViewingUser({ ...found, avatar: getAvatarUrl(found.avatarImage, found.handle) });
            }
          }}
        />
      </div>

      <div className="px-4 space-y-6 pb-28">
        {/* Skeleton */}
        {isLoading && posts.length === 0 && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[36px] p-4 shadow-sm border border-gray-50 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3 px-2">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-28 rounded-full" />
                  <Skeleton className="h-2 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="aspect-[4/5] rounded-[28px] w-full" />
              <div className="flex gap-4 px-2">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))
        )}

        {posts.map((post, index) => {
          const isFollowing = user.following?.includes(post.handle);
          const isLiked = likedPosts.includes(post.id);
          const isFav = favoritePosts.includes(post.id);
          // Alternate card sizes for visual rhythm
          const isLarge = index % 5 === 0;

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[36px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] border border-gray-50 dark:border-white/5"
            >
              {/* Post header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/profile/${encodeURIComponent(post.handle)}`)}
                >
                  <Avatar className="h-11 w-11 rounded-[16px] border-2 border-white dark:border-white/10 shadow-sm">
                    <AvatarImage src={post.avatar} alt={`Avatar de ${post.user}`} loading="lazy" />
                    <AvatarFallback className="rounded-[16px]">{post.user[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm text-gray-900 dark:text-white">{post.user}</p>
                      {post.handle !== user.handle && !user.isGuest && user.isAuthenticated && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFollow(post.handle); }}
                          className="text-[9px] font-black px-2.5 py-1 rounded-full transition-all tap-scale"
                          style={{
                            color: isFollowing ? undefined : primaryColor,
                            backgroundColor: isFollowing ? undefined : `${primaryColor}15`,
                          }}
                          aria-label={isFollowing ? `Ne plus suivre ${post.user}` : `Suivre ${post.user}`}
                          aria-pressed={isFollowing}
                        >
                          {isFollowing
                            ? <span className="text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full">SUIVI</span>
                            : 'SUIVRE'
                          }
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold">{post.time}</p>
                  </div>
                </div>

                {post.handle === user.handle ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors w-9 h-9"
                    aria-label="Supprimer ce post"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="rounded-xl text-gray-300 dark:text-gray-700 hover:text-gray-900 dark:hover:text-white w-9 h-9" aria-label="Plus d'options">
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/* Image */}
              <div
                className={cn("overflow-hidden relative group mx-3 rounded-[28px]", isLarge ? "aspect-[4/5]" : "aspect-[4/4]")}
                onDoubleClick={() => handleDoubleTap(post.id)}
                role="button"
                aria-label={`Image du post de ${post.user}. Double-cliquez pour aimer`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDoubleTap(post.id); }}
              >
                <img
                  src={post.image}
                  alt={`Post de ${post.user}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[28px]" />
                <AnimatePresence>
                  {showHeart === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                      <Heart size={72} fill="white" className="text-white drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions + Caption */}
              <div className="p-4 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => !user.isGuest && handleToggleLike(post.id)}
                      className={cn("flex items-center gap-1.5 transition-all tap-scale", isLiked ? "scale-110" : "text-gray-400 dark:text-gray-600 hover:text-gray-600", user.isGuest && "cursor-default")}
                      style={{ color: isLiked ? primaryColor : undefined }}
                      aria-label={isLiked ? "Retirer le like" : "Aimer ce post"}
                      aria-pressed={isLiked}
                    >
                      <Heart size={22} strokeWidth={2.5} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
                      <span className="font-black text-xs">{post.likes}</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-all tap-scale"
                      onClick={() => navigate(`/post/${post.id}`)}
                      aria-label="Voir les commentaires"
                    >
                      <MessageCircle size={22} strokeWidth={2.5} aria-hidden="true" />
                      <span className="font-black text-xs">{post.comments_count ?? 0}</span>
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-all tap-scale"
                      onClick={async () => {
                        const url = `${window.location.origin}/post/${post.id}`;
                        if (navigator.share) {
                          await navigator.share({ title: `Post de ${post.user}`, text: post.caption, url });
                        } else {
                          await navigator.clipboard.writeText(url);
                          showSuccess('Lien copié ! 🔗');
                        }
                      }}
                      aria-label="Partager ce post"
                    >
                      <Share2 size={22} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                  {/* Favoris — membres connectés uniquement */}
                  {!user.isGuest && (
                  <button
                    onClick={() => {
                      toggleFavoritePost(post.id);
                      showSuccess(isFav ? "Retiré des favoris" : "Enregistré ! ✨");
                    }}
                    className={cn("transition-all tap-scale", isFav ? "scale-110" : "text-gray-400 dark:text-gray-600 hover:text-gray-600")}
                    style={{ color: isFav ? '#EAB308' : undefined }}
                    aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={isFav}
                  >
                    <Bookmark size={22} strokeWidth={2.5} fill={isFav ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                  )}
                  {/* Signaler — membres connectés uniquement */}
                  {!user.isGuest && (
                  <button
                    onClick={async () => {
                      try {
                        await apiService.reportPost(post.id);
                        showSuccess("Merci du signalement, notre équipe va vérifier ce contenu. 🛡️");
                      } catch (err) {
                        showError("Erreur lors du signalement.");
                      }
                    }}
                    className="text-gray-300 dark:text-gray-700 hover:text-red-400 transition-colors"
                    aria-label="Signaler ce post"
                  >
                    <MoreHorizontal size={22} strokeWidth={2.5} />
                  </button>
                  )}
                </div>

                {post.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span
                      className="font-black text-gray-900 dark:text-white mr-1.5 cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${encodeURIComponent(post.handle)}`)}
                    >
                      {post.user}
                    </span>
                    {post.caption}
                  </p>
                )}

                {(post.comments_count ?? 0) > 0 && (
                  <button
                    className="text-[11px] text-gray-400 dark:text-gray-600 font-semibold hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    Voir les {post.comments_count} commentaires
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="flex justify-center py-6">
          {isLoading && <Loader2 size={22} className="animate-spin text-gray-300 dark:text-gray-700" />}
          {!hasMore && posts.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />
              <p className="text-[10px] text-gray-300 dark:text-gray-700 font-black uppercase tracking-widest">Tout est chargé ✨</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Feed;
