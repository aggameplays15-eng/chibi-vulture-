"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from './AuthContext';

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
  items: any[];
}

interface DataContextType {
  products: Product[];
  posts: Post[];
  orders: Order[];
  likedPosts: number[];
  favoritePosts: number[];
  favoriteProducts: number[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: number) => void;
  deletePost: (id: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
  toggleLike: (postId: number) => void;
  toggleFavoritePost: (postId: number) => void;
  toggleFavoriteProduct: (productId: number) => void;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "T-Shirt Chibi Vulture", price: 250000, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300", category: "Vêtements", stock: 15, featured: true },
  { id: 2, name: "Stickers Pack Kawaii", price: 125000, image: "https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300", category: "Accessoires", stock: 5, featured: false },
];

const MOCK_POSTS: Post[] = [
  { id: 1, user: "ChibiMomo", handle: "@momo", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Momo", image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600", likes: 124, caption: "Mon premier dessin ! ✨", time: "2h", reports: 0 },
  { id: 2, user: "VultureKing", handle: "@king", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King", image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=600", likes: 89, caption: "Style Vulture activé 🦅", time: "5h", reports: 2 },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<number[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const loadLocal = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>) => {
        const val = localStorage.getItem(key);
        if (val) setter(JSON.parse(val) as T);
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
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cv_likes', JSON.stringify(likedPosts));
  }, [likedPosts]);

  useEffect(() => {
    localStorage.setItem('cv_fav_posts', JSON.stringify(favoritePosts));
  }, [favoritePosts]);

  useEffect(() => {
    localStorage.setItem('cv_fav_prods', JSON.stringify(favoriteProducts));
  }, [favoriteProducts]);

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
  
  const toggleLike = useCallback(async (postId: number) => {
    if (user.isGuest) return;
    try {
      await apiService.toggleLike(postId, user.handle);
      setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    } catch (err) { console.error(err); }
  }, [user.isGuest, user.handle]);

  const toggleFavoritePost = useCallback((postId: number) => {
    setFavoritePosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  }, []);

  const toggleFavoriteProduct = useCallback((productId: number) => {
    setFavoriteProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  }, []);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...p, id: Date.now() }]);
  }, []);

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      status: 'En attente'
    };
    
    try {
      await apiService.createOrder(newOrder);
      setOrders(prev => [newOrder, ...prev]);
    } catch (err) {
      console.error("Failed to persist order:", err);
      setOrders(prev => [newOrder, ...prev]);
    }
  }, []);

  const contextValue = useMemo(() => ({
    products, posts, orders,
    likedPosts, favoritePosts, favoriteProducts, isLoading,
    addProduct, deleteProduct, deletePost, addOrder,
    toggleLike, toggleFavoritePost, toggleFavoriteProduct
  }), [
    products, posts, orders,
    likedPosts, favoritePosts, favoriteProducts, isLoading,
    addProduct, deleteProduct, deletePost, addOrder,
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
