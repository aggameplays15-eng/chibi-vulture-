"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Settings, Grid, Bookmark, Heart, ShoppingBag, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess } from '@/utils/toast';
import { motion } from 'framer-motion';

const StatCard = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.95 }}
    className="flex flex-col items-center gap-0.5 cursor-pointer"
    onClick={onClick}
  >
    <p className="font-black text-xl text-gray-900 dark:text-white">{value}</p>
    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-bold tracking-wider">{label}</p>
  </motion.div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, posts, products, favoritePosts, favoriteProducts, likedPosts, primaryColor } = useApp();

  const [postCount, setPostCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(user.following?.length || 0);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!user.handle || !user.isAuthenticated) return;
    const fetchCounts = async () => {
      try {
        const [postsData, followData] = await Promise.all([
          apiService.getUserPostCount(user.handle),
          apiService.getFollowCounts(user.handle),
        ]);
        if (Array.isArray(postsData)) {
          // Normalize posts
          const normalized = postsData.map(p => ({
            ...p,
            handle: p.handle || p.user_handle || '@user',
            image: p.image,
            id: p.id
          }));
          setUserPosts(normalized);
          setPostCount(normalized.length);
        }
        if (followData) {
          setFollowersCount(followData.followersCount ?? 0);
          setFollowingCount(followData.followingCount ?? user.following?.length ?? 0);
        }
      } catch {
        setFollowingCount(user.following?.length || 0);
      }
    };
    fetchCounts();
  }, [user.handle, user.isAuthenticated, user.following?.length]);

  const myFavPosts = posts.filter(p => favoritePosts.includes(p.id));
  const myFavProducts = products.filter(p => favoriteProducts.includes(p.id));
  const myLikedPosts = posts.filter(p => likedPosts.includes(p.id));
  const myPosts = userPosts;

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${encodeURIComponent(user.handle)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil de ${user.name}`,
          text: `Découvre mes créations sur Chibi Vulture !`,
          url: url
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      showSuccess("Lien du profil copié ! 🔗");
    }
  };

  return (
    <MainLayout>
      {/* Settings button */}
      <header className="px-6 pt-2 pb-0 flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl w-10 h-10 text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5"
          onClick={() => navigate('/settings')}
        >
          <Settings size={20} />
        </Button>
      </header>

      {/* Profile hero */}
      <div className="px-6 pb-6 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="absolute -inset-1 rounded-[36px] blur-lg opacity-50"
              style={{ backgroundColor: user.avatarColor || primaryColor }}
            />
            <div className="relative">
              <Avatar className="w-28 h-28 rounded-[28px] border-4 border-white dark:border-[hsl(224,20%,10%)] shadow-xl">
                <AvatarImage
                  src={user.avatarImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=${(user.avatarColor || primaryColor).replace('#', '')}`}
                  className="rounded-[24px] object-cover w-full h-full"
                />
                <AvatarFallback className="rounded-[24px] text-2xl font-black">{user.name?.[0]}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => navigate('/edit-profile')}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg tap-scale"
                style={{ backgroundColor: primaryColor }}
              >
                <Camera size={14} />
              </button>
            </div>
          </div>

          {/* Name + handle */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h2>
            <p className="font-bold text-sm" style={{ color: primaryColor }}>{user.handle}</p>
            {user.bio && (
              <p className="text-gray-500 dark:text-gray-500 text-sm max-w-xs mx-auto leading-relaxed mt-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-10 py-4 border-y border-gray-50 dark:border-white/5">
          <StatCard value={postCount} label="Posts" />
          <StatCard
            value={followersCount}
            label="Followers"
            onClick={() => navigate('/followers', { state: { tab: 'followers' } })}
          />
          <StatCard
            value={followingCount}
            label="Following"
            onClick={() => navigate('/followers', { state: { tab: 'following' } })}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/edit-profile')}
            className="flex-1 rounded-2xl font-bold text-white h-11"
            style={{ backgroundColor: primaryColor, boxShadow: `0 8px 24px ${primaryColor}35` }}
          >
            Modifier le profil
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-2xl font-bold h-11 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
            onClick={handleShare}
          >
            Partager
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-gray-50 dark:border-white/5 rounded-none h-12 px-2">
          {[
            { value: 'posts', icon: Grid },
            { value: 'saved', icon: Bookmark },
            { value: 'liked', icon: Heart },
            { value: 'shop', icon: ShoppingBag },
          ].map(({ value, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none h-full border-b-2 border-transparent data-[state=active]:border-b-2 transition-colors text-gray-400 dark:text-gray-600 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              style={{ '--active-border': primaryColor } as React.CSSProperties}
            >
              <Icon size={18} />
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Posts grid */}
        <TabsContent value="posts" className="p-1 mt-0">
          {myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                <Grid size={20} className="text-gray-300 dark:text-gray-700" />
              </div>
              <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucune publication</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="aspect-square bg-gray-100 dark:bg-white/5 cursor-pointer overflow-hidden relative group"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <img src={post.image} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Heart size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved posts */}
        <TabsContent value="saved" className="p-1 mt-0">
          {myFavPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                <Bookmark size={20} className="text-gray-300 dark:text-gray-700" />
              </div>
              <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucun post enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myFavPosts.map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 dark:bg-white/5 cursor-pointer overflow-hidden" onClick={() => navigate(`/post/${post.id}`)}>
                  <img src={post.image} alt="Saved" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Liked posts */}
        <TabsContent value="liked" className="p-1 mt-0">
          {myLikedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                <Heart size={20} className="text-gray-300 dark:text-gray-700" />
              </div>
              <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucun like pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myLikedPosts.map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 dark:bg-white/5 cursor-pointer overflow-hidden" onClick={() => navigate(`/post/${post.id}`)}>
                  <img src={post.image} alt="Liked" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fav products */}
        <TabsContent value="shop" className="p-4 mt-0">
          {myFavProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                <ShoppingBag size={20} className="text-gray-300 dark:text-gray-700" />
              </div>
              <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucun produit favori</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myFavProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-gray-50 dark:border-white/5 overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
                  <div className="p-3 space-y-0.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs font-black" style={{ color: primaryColor }}>{product.price.toLocaleString()} GNF</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Profile;
