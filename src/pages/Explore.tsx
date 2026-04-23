"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Search, Flame, Star, TrendingUp, Sparkles, Loader2, X, UserPlus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const taggedPosts = activeTag
    ? contextPosts.filter(p => p.caption?.toLowerCase().includes(activeTag.replace('#', '')))
    : contextPosts.slice(0, 6);

  const isSearchMode = searchQuery.length >= 2;

  return (
    <MainLayout>
      <header className="p-6 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={12} style={{ color: primaryColor }} className="animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Exploration</p>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Découvrir</h1>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-10 h-13 rounded-2xl border-none bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-2 h-12"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            placeholder="Artistes, tags, styles..."
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
              >
                <X size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Tag pills */}
        {!isSearchMode && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                className={cn(
                  "px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-premium whitespace-nowrap tap-scale",
                  activeTag === tag
                    ? "text-white shadow-lg"
                    : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                )}
                style={{ backgroundColor: activeTag === tag ? primaryColor : undefined }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-5 space-y-10 pb-24">

        {/* Search results */}
        <AnimatePresence mode="wait">
          {isSearchMode && (
            <motion.section
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {isSearching && (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-gray-300 dark:text-gray-700" />
                </div>
              )}

              {!isSearching && searchResults && (
                <>
                  {searchResults.users.length > 0 && (
                    <div>
                      <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <Star size={12} style={{ color: primaryColor }} />
                        Artistes
                      </h2>
                      <div className="space-y-2">
                        {searchResults.users.map(u => (
                          <motion.div
                            key={u.id}
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl cursor-pointer border border-gray-50 dark:border-white/5 hover:shadow-sm transition-shadow"
                            onClick={() => navigate(`/profile/${encodeURIComponent(u.handle)}`)}
                          >
                            <Avatar className="w-11 h-11 rounded-[14px]">
                              <AvatarImage src={u.avatar_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`} className="object-cover w-full h-full" />
                              <AvatarFallback className="rounded-[14px]">{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm text-gray-900 dark:text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-600 font-semibold">{u.handle}</p>
                            </div>
                            {u.handle !== user.handle && !user.isGuest && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFollow(u.handle); }}
                                className="flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full text-white tap-scale"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <UserPlus size={10} />
                                Suivre
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.posts.length > 0 && (
                    <div>
                      <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <Flame size={12} className="text-orange-400" />
                        Posts
                      </h2>
                      <div className="grid grid-cols-2 gap-2">
                        {searchResults.posts.map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ y: -3 }}
                            className="aspect-square rounded-[20px] overflow-hidden cursor-pointer relative group"
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
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-14 h-14 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                        <Search size={20} className="text-gray-300 dark:text-gray-700" />
                      </div>
                      <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucun résultat pour "{searchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </motion.section>
          )}

          {/* Default view */}
          {!isSearchMode && (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* Trending posts */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500">
                      <Flame size={16} />
                    </div>
                    <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                      {activeTag ? `Posts ${activeTag}` : 'Tendances'}
                    </h2>
                  </div>
                  <TrendingUp size={14} className="text-gray-300 dark:text-gray-700" />
                </div>

                {/* Masonry-style grid */}
                <div className="grid grid-cols-2 gap-2">
                  {taggedPosts.slice(0, 10).map((post, i) => {
                    const isWide = i === 0;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        className={cn(
                          "rounded-[24px] bg-gray-100 dark:bg-white/5 overflow-hidden relative group cursor-pointer",
                          isWide ? "col-span-2 aspect-[2/1]" : "aspect-[3/4]"
                        )}
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <img
                          src={post.image}
                          alt="Trend"
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <p className="text-white text-[10px] font-bold truncate">{post.handle}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {taggedPosts.length === 0 && (
                  <div className="flex flex-col items-center py-10 opacity-50">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Aucune tendance pour le moment</p>
                  </div>
                )}
              </section>

              {/* Artists to follow */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500">
                      <Star size={16} />
                    </div>
                    <h2 className="font-black text-gray-900 dark:text-white uppercase tracking-wider text-xs">Artistes à suivre</h2>
                  </div>
                  <Sparkles size={14} className="text-gray-300 dark:text-gray-700" />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {contextUsers.filter(u => u.handle !== user.handle && u.isApproved).slice(0, 10).map((u, i) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer group"
                      onClick={() => navigate(`/profile/${encodeURIComponent(u.handle)}`)}
                    >
                      <div
                        className="w-16 h-16 rounded-[20px] p-[2px] transition-transform group-hover:scale-105 tap-scale"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}80, #8B5CF680)` }}
                      >
                        <div className="w-full h-full rounded-[18px] bg-white dark:bg-[hsl(224,20%,10%)] p-[2px]">
                          <img
                            src={u.avatarImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.handle}`}
                            alt={u.name}
                            className="w-full h-full rounded-[16px] object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-tight truncate w-full text-center">
                        {u.handle.replace('@', '')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default Explore;
