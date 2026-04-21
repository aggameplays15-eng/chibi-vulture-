"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bell, Bookmark, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';
import { useInfinitePosts } from '@/hooks/use-infinite-posts';
import { apiService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Feed = () => {
  const navigate = useNavigate();
  const { likedPosts, favoritePosts, toggleLike, toggleFavoritePost, toggleFollow, user, primaryColor } = useApp();
  const [showHeart, setShowHeart] = useState<number | null>(null);
  const { posts, loadMore, hasMore, isLoading, removePost } = useInfinitePosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleDeletePost = async (postId: number) => {
    try {
      await apiService.deletePost(postId);
      removePost(postId);
      showSuccess("Post supprimé. 🗑️");
    } catch {
      showError("Impossible de supprimer ce post.");
    }
  };

  // Charger la première page
  useEffect(() => {
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer pour scroll infini
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
    if (!likedPosts.includes(postId)) toggleLike(postId);
    setShowHeart(postId);
    setTimeout(() => setShowHeart(null), 800);
  };

  return (
    <MainLayout>
      <header className="px-6 pt-12 pb-6 flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: primaryColor }} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Communauté</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Pour toi</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-white shadow-sm text-gray-400 hover:text-gray-900"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={22} aria-hidden="true" />
        </Button>
      </header>

      <div className="px-4 space-y-10 pb-24">
        {posts.map((post, index) => {
          const isFollowing = user.following?.includes(post.handle);
          const isLiked = likedPosts.includes(post.id);
          const isFav = favoritePosts.includes(post.id);

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="bg-white rounded-[40px] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-gray-50"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-11 w-11 rounded-2xl border-2 border-white shadow-sm">
                      <AvatarImage src={post.avatar} alt={`Avatar de ${post.user}`} loading="lazy" />
                      <AvatarFallback>{post.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm text-gray-900">{post.user}</p>
                      {post.handle !== user.handle && !user.isGuest && (
                        <button
                          onClick={() => toggleFollow(post.handle)}
                          className={cn(
                            "text-[9px] font-black px-2.5 py-1 rounded-full transition-all",
                            isFollowing ? "bg-gray-100 text-gray-400" : "bg-pink-50 text-pink-500"
                          )}
                          style={{ color: !isFollowing ? primaryColor : undefined, backgroundColor: !isFollowing ? `${primaryColor}10` : undefined }}
                          aria-label={isFollowing ? `Ne plus suivre ${post.user}` : `Suivre ${post.user}`}
                          aria-pressed={isFollowing}
                        >
                          {isFollowing ? 'SUIVI' : 'SUIVRE'}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{post.time}</p>
                  </div>
                </div>
                {post.handle === user.handle ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-gray-300 hover:text-red-400 transition-colors"
                    aria-label="Supprimer ce post"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="rounded-xl text-gray-300 hover:text-gray-900" aria-label="Plus d'options">
                    <MoreHorizontal size={20} aria-hidden="true" />
                  </Button>
                )}              </div>

              <div
                className="aspect-[4/5] overflow-hidden rounded-[32px] relative group"
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
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <AnimatePresence>
                  {showHeart === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                      <Heart size={80} fill="white" className="text-white drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-5 px-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={cn("flex items-center gap-2 transition-all", isLiked ? "scale-110" : "text-gray-400 hover:text-gray-600")}
                      style={{ color: isLiked ? primaryColor : undefined }}
                      aria-label={isLiked ? "Retirer le like" : "Aimer ce post"}
                      aria-pressed={isLiked}
                    >
                      <Heart size={26} strokeWidth={2.5} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
                      <span className="font-black text-xs">{post.likes + (isLiked ? 1 : 0)}</span>
                    </button>
                    <button
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-all"
                      onClick={() => navigate(`/post/${post.id}`)}
                      aria-label="Voir les commentaires"
                    >
                      <MessageCircle size={26} strokeWidth={2.5} aria-hidden="true" />
                      <span className="font-black text-xs">{post.comments_count ?? 0}</span>
                    </button>
                    <button
                      className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-all"
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
                      <Share2 size={26} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      toggleFavoritePost(post.id);
                      showSuccess(isFav ? "Retiré des favoris" : "Enregistré ! ✨");
                    }}
                    className={cn("transition-all", isFav ? "scale-110" : "text-gray-400 hover:text-gray-600")}
                    style={{ color: isFav ? '#EAB308' : undefined }}
                    aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                    aria-pressed={isFav}
                  >
                    <Bookmark size={26} strokeWidth={2.5} fill={isFav ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-black text-gray-900 mr-2">{post.user}</span>
                  {post.caption}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Sentinel pour scroll infini */}
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && <Loader2 size={24} className="animate-spin text-gray-300" />}
          {!hasMore && posts.length > 0 && (
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Tout est chargé ✨</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Feed;
