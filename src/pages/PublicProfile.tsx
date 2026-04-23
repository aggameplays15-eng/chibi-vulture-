"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Grid, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { getAvatarUrl } from '@/utils/avatar';
import { apiService } from '@/services/api';
import { showSuccess } from '@/utils/toast';
import SEO from '@/components/SEO';

interface PublicUser {
  id: number;
  name: string;
  handle: string;
  bio: string;
  avatar_color: string;
  avatar_image: string | null;
  role: string;
}

const PublicProfile = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { user, toggleFollow, primaryColor } = useApp();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<{ id: number; image: string; caption: string }[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const decodedHandle = handle ? decodeURIComponent(handle) : '';
  const isOwnProfile = user.handle === decodedHandle || user.handle === `@${decodedHandle}`;

  useEffect(() => {
    if (isOwnProfile) { navigate('/profile', { replace: true }); return; }
    if (!decodedHandle) return;

    const load = async () => {
      setIsLoading(true);
      // Reset state for new profile
      setProfile(null);
      setPosts([]);
      
      try {
        const fullHandle = decodedHandle.startsWith('@') ? decodedHandle : `@${decodedHandle}`;
        const [found, followData, postsData] = await Promise.all([
          apiService.getUserByHandle(fullHandle),
          apiService.getFollowCounts(fullHandle),
          apiService.getUserPostCount(fullHandle)
        ]);

        if (found) setProfile(found);
        if (followData) {
          setFollowersCount(followData.followersCount ?? 0);
          setFollowingCount(followData.followingCount ?? 0);
        }
        if (Array.isArray(postsData)) setPosts(postsData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [decodedHandle, isOwnProfile, navigate]);

  const isFollowing = user.following?.includes(profile?.handle || '');

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-xl font-black text-gray-900 truncate">{decodedHandle}</h1>
      </header>

      {isLoading ? (
        <div className="px-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-32 h-32 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-xl" />
            <Skeleton className="h-4 w-56 rounded-xl" />
          </div>
          <div className="flex justify-center gap-8">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-16 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="font-bold">Utilisateur introuvable.</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Retour</Button>
        </div>
      ) : (
        <>
          <SEO 
            title={`Profil de ${profile.name}`} 
            description={profile.bio || `Découvrez l'art de ${profile.name} sur Chibi Vulture.`}
            image={profile.avatar_image || undefined}
            type="profile"
          />
          <div className="px-6 pb-6 text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full blur-lg opacity-40 animate-pulse" style={{ backgroundColor: profile.avatar_color }} />
              <Avatar className="w-32 h-32 border-4 border-white relative z-10">
                <AvatarImage src={getAvatarUrl(profile.avatar_image, profile.handle)} className="object-cover w-full h-full" />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">{profile.name}</h2>
              <p className="font-bold text-sm" style={{ color: primaryColor }}>{profile.handle}</p>
            </div>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">{profile.bio || "Aucune biographie."}</p>

            <div className="flex justify-center gap-8 py-4 border-y border-pink-50">
              <div><p className="font-black text-lg">{posts.length}</p><p className="text-[10px] text-gray-400 uppercase font-bold">Posts</p></div>
              <div><p className="font-black text-lg">{followersCount}</p><p className="text-[10px] text-gray-400 uppercase font-bold">Followers</p></div>
              <div><p className="font-black text-lg">{followingCount}</p><p className="text-[10px] text-gray-400 uppercase font-bold">Following</p></div>
            </div>

            <div className="flex gap-3">
              {!user.isGuest && (
                <Button
                  onClick={() => toggleFollow(profile.handle)}
                  className="flex-1 rounded-2xl font-bold text-white"
                  style={{ backgroundColor: isFollowing ? '#9ca3af' : primaryColor }}
                >
                  {isFollowing ? 'Ne plus suivre' : 'Suivre'}
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 rounded-2xl font-bold h-11 border-gray-100 text-gray-500"
                onClick={async () => {
                  const url = `${window.location.origin}/profile/${encodeURIComponent(profile.handle)}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: `Profil de ${profile.name}`, url });
                    } catch {}
                  } else {
                    await navigator.clipboard.writeText(url);
                    showSuccess("Lien copié ! 🔗");
                  }
                }}
              >
                Partager
              </Button>
            </div>
          </div>

          <div className="px-4 pb-24">
            <div className="flex items-center gap-2 mb-4 px-2">
              <Grid size={16} className="text-gray-400" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Posts</span>
            </div>
            {posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post: { id: number; image: string; caption: string }) => (
                  <div key={post.id} className="aspect-square bg-gray-100 cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                    <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400 font-bold">Aucune publication.</p>
            )}
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default PublicProfile;
