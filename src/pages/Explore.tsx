"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Search, Flame, Star, TrendingUp, Sparkles, Loader2, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { useDebounce } from '@/hooks/use-debounce';
import { motion } from 'framer-motion';

const TAGS = ["#chibi", "#kawaii", "#vulture", "#stickers", "#digitalart", "#pastel", "#anime", "#guinee", "#conakry"];

interface SearchResult {
  users: { id: number; name: string; handle: string; avatar_image: string | null; bio: string; role: string }[];
  posts: { id: number; image: string; caption: string; user_handle: string; user_name: string; user_avatar: string | null }[];
}

const Explore = () => {
  const navigate = useNavigate();
  const { primaryColor, posts: contextPosts, users: contextUsers, toggleFollow, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Recherche réelle
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    apiService.search(debouncedQuery)
      .then(data => { if (data) setSearchResults(data); })
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  // Filtrer les posts du contexte par tag actif
  const taggedPosts = activeTag
    ? contextPosts.filter(p => p.caption?.toLowerCase().includes(activeTag.replace('#', '')))
    : contextPosts.slice(0, 4);

  const isSearchMode = searchQuery.length >= 2;

  return (
    <MainLayout>
      <header className="p-6 space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: primaryColor }}>Exploration</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">DÉCOUVRIR</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-10 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-2"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Artistes, tags, styles..."
          />
          {searchQuery && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
              aria-label="Effacer la recherche"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {!isSearchMode && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {TAGS.map(tag => (
              <Badge
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                className={`cursor-pointer px-5 py-2 rounded-full border-none transition-all whitespace-nowrap font-bold ${
                  activeTag === tag ? 'text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={{ backgroundColor: activeTag === tag ? primaryColor : undefined }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="px-6 space-y-10 pb-20">

        {/* Résultats de recherche */}
        {isSearchMode && (
          <section className="space-y-6">
            {isSearching && (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-300" />
              </div>
            )}

            {!isSearching && searchResults && (
              <>
                {/* Utilisateurs */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm mb-4">Artistes</h2>
                    <div className="space-y-3">
                      {searchResults.users.map(u => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => navigate(`/profile/${encodeURIComponent(u.handle)}`)}
                        >
                          <Avatar className="w-12 h-12 rounded-2xl">
                            <AvatarImage src={u.avatar_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`} />
                            <AvatarFallback>{u.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-gray-900 truncate">{u.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{u.handle}</p>
                          </div>
                          {u.handle !== user.handle && !user.isGuest && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFollow(u.handle); }}
                              className="text-[10px] font-black px-3 py-1.5 rounded-full text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              SUIVRE
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts */}
                {searchResults.posts.length > 0 && (
                  <div>
                    <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm mb-4">Posts</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {searchResults.posts.map(p => (
                        <motion.div
                          key={p.id}
                          whileHover={{ y: -3 }}
                          className="aspect-square rounded-[24px] overflow-hidden cursor-pointer relative group"
                          onClick={() => navigate(`/post/${p.id}`)}
                        >
                          <img src={p.image} alt={p.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <p className="text-white text-[10px] font-bold truncate">{p.caption}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 font-bold">Aucun résultat pour "{searchQuery}"</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Vue par défaut */}
        {!isSearchMode && (
          <>
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
                    <Flame size={20} />
                  </div>
                  <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm">
                    {activeTag ? `Posts ${activeTag}` : 'Tendances'}
                  </h2>
                </div>
                <TrendingUp size={16} className="text-gray-300" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {taggedPosts.length > 0 ? taggedPosts.slice(0, 4).map((post) => (
                  <motion.div
                    key={post.id}
                    whileHover={{ y: -5 }}
                    className="aspect-[3/4] rounded-[32px] bg-gray-100 overflow-hidden relative group cursor-pointer shadow-sm"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <img
                      src={post.image}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1">Illustration</p>
                      <p className="text-white text-xs font-bold">{post.handle}</p>
                    </div>
                  </motion.div>
                )) : [1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="aspect-[3/4] rounded-[32px] bg-gray-100 overflow-hidden relative group cursor-pointer shadow-sm"
                  >
                    <img
                      src={`https://picsum.photos/seed/chibi${i + 10}/400/600`}
                      alt="Trend"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </motion.div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-yellow-50 text-yellow-500">
                    <Star size={20} />
                  </div>
                  <h2 className="font-black text-gray-900 uppercase tracking-wider text-sm">Artistes à suivre</h2>
                </div>
                <Sparkles size={16} className="text-gray-300" />
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar">
                {contextUsers.filter(u => u.handle !== user.handle && u.isApproved).slice(0, 8).map((u) => (
                  <div key={u.id} className="flex flex-col items-center gap-3 min-w-[90px] group cursor-pointer" onClick={() => navigate(`/profile/${encodeURIComponent(u.handle)}`)}>
                    <div className="relative">
                      <div
                        className="w-20 h-20 rounded-[28px] p-1 transition-transform group-hover:rotate-6"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <img
                          src={u.avatarImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`}
                          alt={u.name}
                          className="w-full h-full rounded-[24px] bg-white object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter truncate w-full text-center">
                      {u.handle}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
