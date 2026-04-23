"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from './AuthContext';
import type { OrderItem } from '@/types/api';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
}

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
}

interface Order {
  id: string;
  customer: string;
  total: number;
  status: 'En attente' | 'Préparation' | 'Livré';
  date: string;
  items: OrderItem[];
  phone?: string;
  shipping_address?: string;
}

interface DataContextType {
  products: Product[];
  posts: Post[];
  orders: Order[];
  likedPosts: number[];
  favoritePosts: number[];
  favoriteProducts: number[];
  isLoading: boolean;
  updateProduct: (id: number, product: Omit<Product, 'id'>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: number) => void;
  deletePost: (id: number) => void;
  addPost: (post: any) => void;
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<string>;
  toggleLike: (postId: number) => void;
  toggleFavoritePost: (postId: number) => void;
  toggleFavoriteProduct: (productId: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<number[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user.id) {
      setLikedPosts([]);
      setFavoritePosts([]);
      setFavoriteProducts([]);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      const userId = user.id;
      const loadLocal = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>) => {
        const val = localStorage.getItem(`${key}_${userId}`);
        if (val) setter(JSON.parse(val) as T);
        else setter([] as unknown as T);
      };
      
      loadLocal('cv_likes', setLikedPosts);
      loadLocal('cv_fav_posts', setFavoritePosts);
      loadLocal('cv_fav_prods', setFavoriteProducts);

      try {
        const isAdmin = user?.role === 'Admin';
        const fetches: Promise<unknown>[] = [
          apiService.getProducts(),
          apiService.getPosts(1, 20),
          isAdmin ? apiService.getOrders() : Promise.resolve(null),
        ];

        const [realProducts, realPosts, realOrders] = await Promise.allSettled(fetches);

        if (realProducts.status === 'fulfilled' && realProducts.value) setProducts(realProducts.value as Product[]);
        if (realPosts.status === 'fulfilled' && realPosts.value) setPosts(realPosts.value as Post[]);
        if (realOrders.status === 'fulfilled' && realOrders.value) setOrders(realOrders.value as Order[]);
      } catch (err) {
        console.error("Backend fetch error:", err);
      }
      
      setIsLoading(false);
    };
    
    load();
  }, [user.id, user.role]);

  useEffect(() => {
    if (user.id) localStorage.setItem(`cv_likes_${user.id}`, JSON.stringify(likedPosts));
  }, [likedPosts, user.id]);

  useEffect(() => {
    if (user.id) localStorage.setItem(`cv_fav_posts_${user.id}`, JSON.stringify(favoritePosts));
  }, [favoritePosts, user.id]);

  useEffect(() => {
    if (user.id) localStorage.setItem(`cv_fav_prods_${user.id}`, JSON.stringify(favoriteProducts));
  }, [favoriteProducts, user.id]);

  const deleteProduct = useCallback(async (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deleteProduct(id);
    } catch (err) { console.error(err); }
  }, []);

  const deletePost = useCallback(async (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deletePost(id);
    } catch (err) { console.error(err); }
  }, []);

  const addPost = useCallback((post: Post) => {
    const normalizedPost = {
      ...post,
      user: post.user || post.user_name || 'Artiste',
      handle: post.handle || post.user_handle || '@user',
      avatar: post.avatar || post.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_handle}`,
      time: post.time || "À l'instant",
      likes: post.likes || 0
    };
    setPosts(prev => [normalizedPost, ...prev]);
  }, []);
  
  const toggleLike = useCallback(async (postId: number) => {
    if (user.isGuest || !user.isAuthenticated) return;
    try {
      await apiService.toggleLike(postId, user.handle);
      setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    } catch (err) { console.error(err); }
  }, [user.isGuest, user.isAuthenticated, user.handle]);

  const toggleFavoritePost = useCallback((postId: number) => {
    setFavoritePosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  }, []);

  const toggleFavoriteProduct = useCallback((productId: number) => {
    setFavoriteProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  }, []);

  const addProduct = useCallback(async (p: Omit<Product, 'id'>) => {
    try {
      const result = await apiService.addProduct(p);
      const newProduct = result ?? { ...p, id: Date.now() };
      setProducts(prev => [...prev, newProduct]);
    } catch (err) {
      console.error('Failed to add product:', err);
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id: number, p: Omit<Product, 'id'>) => {
    try {
      const result = await apiService.updateProduct(id, p);
      const updated = result ?? { ...p, id };
      setProducts(prev => prev.map(prod => prod.id === id ? updated : prod));
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  }, []);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const localId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: localId,
      date: new Date().toLocaleDateString(),
      status: 'En attente'
    };
    
    try {
      const result = await apiService.createOrder({
        id: localId,
        customer_name: orderData.customer,
        total: orderData.total,
        items: orderData.items,
        phone: orderData.phone,
        shipping_address: orderData.shipping_address,
      });
      const finalId = result?.id ? String(result.id) : localId;
      setOrders(prev => [{ ...newOrder, id: finalId }, ...prev]);
      return finalId;
    } catch (err) {
      console.error("Failed to persist order:", err);
      setOrders(prev => [newOrder, ...prev]);
      return localId;
    }
  }, []);

  const contextValue = useMemo(() => ({
    products, posts, orders,
    likedPosts, favoritePosts, favoriteProducts, isLoading,
    addProduct, updateProduct, deleteProduct, deletePost, addPost, addOrder,
    toggleLike, toggleFavoritePost, toggleFavoriteProduct
  }), [
    products, posts, orders,
    likedPosts, favoritePosts, favoriteProducts, isLoading,
    addProduct, updateProduct, deleteProduct, deletePost, addPost, addOrder,
    toggleLike, toggleFavoritePost, toggleFavoriteProduct
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
