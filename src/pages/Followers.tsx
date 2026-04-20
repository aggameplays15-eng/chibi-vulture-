"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, Search, UserPlus, UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

interface FollowUser {
  handle: string;
  name?: string;
}

const UserRow = ({ handle, name, isFollowing, onToggle, primaryColor }: {
  handle: string;
  name?: string;
  isFollowing: boolean;
  onToggle: (handle: string) => void;
  primaryColor: string;
}) => (
  <div className="flex items-center justify-between p-2">
    <div className="flex items-center gap-3">
      <Avatar className="w-12 h-12 border-2 border-pink-50">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`} />
        <AvatarFallback>{(name || handle)[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-black text-sm text-gray-800">{name || handle}</p>
        <p className="text-xs text-gray-400 font-bold">{handle}</p>
      </div>
    </div>
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      className="rounded-xl font-bold h-9 px-4"
      style={!isFollowing ? { backgroundColor: primaryColor, color: 'white' } : {}}
      onClick={() => onToggle(handle)}
    >
      {isFollowing ? <UserCheck size={16} className="mr-2" /> : <UserPlus size={16} className="mr-2" />}
      {isFollowing ? "Suivi" : "Suivre"}
    </Button>
  </div>
);

const Followers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = location.state?.tab || "followers";
  const { user, toggleFollow, primaryColor } = useApp();

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.handle || user.isGuest) { setIsLoading(false); return; }

    apiService.getFollowCounts(user.handle)
      .then(data => {
        if (!data) return;
        setFollowersCount(data.followersCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
        setFollowers((data.followers || []).map((h: string) => ({ handle: h })));
        setFollowing((data.following || []).map((h: string) => ({ handle: h })));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user.handle, user.isGuest]);

  const handleToggle = (handle: string) => {
    toggleFollow(handle);
    setFollowing(prev =>
      prev.some(u => u.handle === handle)
        ? prev.filter(u => u.handle !== handle)
        : [...prev, { handle }]
    );
  };

  const filterList = (list: FollowUser[]) =>
    list.filter(u =>
      !search || u.handle.toLowerCase().includes(search.toLowerCase()) || (u.name || '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <MainLayout>
      <header className="p-4 flex items-center gap-3 border-b border-pink-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-black text-gray-800 uppercase">Communauté</h1>
      </header>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10 rounded-2xl border-gray-100 bg-gray-50/50"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full bg-gray-100/50 p-1 rounded-2xl h-12 mb-6">
            <TabsTrigger value="followers" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
              {followersCount} Abonnés
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
              {followingCount} Abonnements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-4 mt-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : filterList(followers).length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-bold text-sm">Aucun abonné pour le moment.</p>
            ) : (
              filterList(followers).map(u => (
                <UserRow
                  key={u.handle}
                  handle={u.handle}
                  name={u.name}
                  isFollowing={user.following?.includes(u.handle) ?? false}
                  onToggle={handleToggle}
                  primaryColor={primaryColor}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4 mt-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : filterList(following).length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-bold text-sm">Aucun abonnement pour le moment.</p>
            ) : (
              filterList(following).map(u => (
                <UserRow
                  key={u.handle}
                  handle={u.handle}
                  name={u.name}
                  isFollowing={true}
                  onToggle={handleToggle}
                  primaryColor={primaryColor}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Followers;
