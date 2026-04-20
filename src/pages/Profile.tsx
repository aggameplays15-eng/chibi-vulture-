"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Settings, Grid, Bookmark, Heart, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, posts, products, favoritePosts, favoriteProducts, likedPosts, primaryColor } = useApp();

  const [postCount, setPostCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(user.following?.length || 0);

  useEffect(() => {
    if (!user.handle || user.isGuest) return;

    const fetchCounts = async () => {
      try {
        const [userPosts, followData] = await Promise.all([
          apiService.getUserPostCount(user.handle),
          apiService.getFollowCounts(user.handle),
        ]);
        if (Array.isArray(userPosts)) setPostCount(userPosts.length);
        if (followData) {
          setFollowersCount(followData.followersCount ?? 0);
          setFollowingCount(followData.followingCount ?? user.following?.length ?? 0);
        }
      } catch {
        // Fallback to local data
        setFollowingCount(user.following?.length || 0);
      }
    };

    fetchCounts();
  }, [user.handle, user.isGuest, user.following?.length]);

  const myFavPosts = posts.filter(p => favoritePosts.includes(p.id));
  const myFavProducts = products.filter(p => favoriteProducts.includes(p.id));
  const myLikedPosts = posts.filter(p => likedPosts.includes(p.id));

  return (
    <MainLayout>
      <header className="p-6 flex justify-end">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/settings')}>
          <Settings size={24} className="text-gray-400" />
        </Button>
      </header>

      <div className="px-6 pb-6 text-center space-y-4">
        <div className="relative inline-block">
          <div
            className="absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse"
            style={{ backgroundColor: user.avatarColor }}
          />
          <Avatar className="w-32 h-32 border-4 border-white relative z-10">
            <AvatarImage src={user.avatarImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=${user.avatarColor.replace('#', '')}`} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
          <p className="font-bold text-sm" style={{ color: primaryColor }}>{user.handle}</p>
        </div>

        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          {user.bio || "Aucune biographie pour le moment. ✨"}
        </p>

        <div className="flex justify-center gap-8 py-4 border-y border-pink-50">
          <div className="cursor-pointer">
            <p className="font-black text-lg">{postCount}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Posts</p>
          </div>
          <div className="cursor-pointer" onClick={() => navigate('/followers', { state: { tab: 'followers' } })}>
            <p className="font-black text-lg">{followersCount}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Followers</p>
          </div>
          <div className="cursor-pointer" onClick={() => navigate('/followers', { state: { tab: 'following' } })}>
            <p className="font-black text-lg">{followingCount}</p>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Following</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/edit-profile')}
              className="flex-1 rounded-2xl font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Modifier Profil
            </Button>
            <Button variant="outline" className="flex-1 rounded-2xl font-bold" style={{ color: primaryColor, borderColor: `${primaryColor}40` }}>
              Partager
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-pink-50 rounded-none h-12">
          <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 rounded-none" style={{ borderBottomColor: primaryColor }}>
            <Grid size={20} />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 rounded-none" style={{ borderBottomColor: primaryColor }}>
            <Bookmark size={20} />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 rounded-none" style={{ borderBottomColor: primaryColor }}>
            <Heart size={20} />
          </TabsTrigger>
          <TabsTrigger value="shop" className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 rounded-none" style={{ borderBottomColor: primaryColor }}>
            <ShoppingBag size={20} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="p-4">
          {myLikedPosts.length === 0 && postCount === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold">Aucune publication pour le moment.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.filter(p => p.handle === user.handle).map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="p-4">
          {myFavPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {myFavPosts.map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <img src={post.image} alt="Saved" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gray-400 font-bold">Aucun post enregistré.</p>
          )}
        </TabsContent>

        <TabsContent value="liked" className="p-4">
          {myLikedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {myLikedPosts.map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <img src={post.image} alt="Liked" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gray-400 font-bold">Aucun like pour le moment.</p>
          )}
        </TabsContent>

        <TabsContent value="shop" className="p-4">
          {myFavProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {myFavProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-50 overflow-hidden shadow-sm cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image} alt="Fav Product" className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <p className="text-[10px] font-black truncate">{product.name}</p>
                    <p className="text-[10px] font-black" style={{ color: primaryColor }}>{product.price.toLocaleString()} GNF</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-gray-400 font-bold">Aucun produit favori.</p>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Profile;
