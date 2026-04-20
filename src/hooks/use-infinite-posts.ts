import { useState, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';

interface Post {
  id: number;
  user: string;
  handle: string;
  avatar: string;
  image: string;
  likes: number;
  caption: string;
  time: string;
  reports?: number;
  comments_count?: number;
  user_name?: string;
  user_avatar?: string;
  user_handle?: string;
}

export const useInfinitePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const normalize = (raw: Post): Post => ({
    ...raw,
    user: raw.user_name || raw.user || 'Artiste',
    handle: raw.user_handle || raw.handle || '@user',
    avatar: raw.user_avatar || raw.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${raw.user_handle}`,
    time: raw.time || new Date((raw as unknown as { created_at: string }).created_at).toLocaleDateString('fr-FR'),
    likes: raw.likes || 0,
  });

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const data = await apiService.getPosts(page, 10);
      // Gérer les cas où l'API retourne une erreur ou un format inattendu
      if (!data || !Array.isArray(data)) {
        setHasMore(false);
      } else if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const newPosts = data.filter((p: Post) => !ids.has(p.id)).map(normalize);
          return [...prev, ...newPosts];
        });
        setPage(p => p + 1);
        if (data.length < 10) setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [page, hasMore]);

  const reset = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return { posts, loadMore, hasMore, isLoading, reset };
};
