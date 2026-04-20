"use client";
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiService } from '@/services/api';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

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
  items: CartItem[];
}

interface DeliveryZone {
  id: string;
  label: string;
  price: number;
}

interface UserProfile {
  id: number;
  name: string;
  handle: string;
  email?: string;
  bio: string;
  avatarColor: string;
  avatarImage?: string;
  role: 'Guest' | 'Member' | 'Artiste' | 'Admin';
  isApproved: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  status: 'Actif' | 'Signalé' | 'Banni';
  following: string[];
}

interface AddProductInput {
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  user: UserProfile;
  users: UserProfile[];
  products: Product[];
  posts: Post[];
  orders: Order[];
  updateUser: (data: Partial<UserProfile>) => void;
  approveUser: (id: number) => void;
  banUser: (id: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (id: number) => void;
  deletePost: (id: number) => void;
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => void;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  adminLogin: (credentials: { email: string; password: string }) => Promise<boolean>;
  setGuestMode: () => void;
  logout: () => void;
  likedPosts: number[];
  favoritePosts: number[];
  favoriteProducts: number[];
  toggleLike: (postId: number) => void;
  toggleFavoritePost: (postId: number) => void;
  toggleFavoriteProduct: (productId: number) => void;
  toggleFollow: (handle: string) => void;
  isLoading: boolean;
  logoUrl: string;
  updateLogo: (url: string) => void;
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  deliveryZones: DeliveryZone[];
  updateDeliveryZones: (zones: DeliveryZone[]) => void;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: "T-Shirt Chibi Vulture", price: 250000, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300", category: "Vêtements", stock: 15, featured: true },
  { id: 2, name: "Stickers Pack Kawaii", price: 125000, image: "https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300", category: "Accessoires", stock: 5, featured: false },
];

const MOCK_POSTS: Post[] = [
  { id: 1, user: "ChibiMomo", handle: "@momo", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Momo", image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600", likes: 124, caption: "Mon premier dessin ! ✨", time: "2h", reports: 0 },
  { id: 2, user: "VultureKing", handle: "@king", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King", image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=600", likes: 89, caption: "Style Vulture activé 🦅", time: "5h", reports: 2 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<number[]>([]);
  const [logoUrl, setLogoUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture");
  const [primaryColor, setPrimaryColor] = useState("#EC4899");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: 0, name: "Invité", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Guest', isApproved: false, isAuthenticated: false, isGuest: true, status: 'Actif', following: []
  });

  useEffect(() => {
    const load = async () => {
      const loadLocal = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>) => {
        const val = localStorage.getItem(key);
        if (val) setter(JSON.parse(val) as T);
      };
      
      loadLocal('cv_cart', setCart);
      loadLocal('cv_user', setUser);
      loadLocal('cv_users_list', setUsers);
      loadLocal('cv_likes', setLikedPosts);
      loadLocal('cv_fav_posts', setFavoritePosts);
      loadLocal('cv_fav_prods', setFavoriteProducts);
      loadLocal('cv_zones', setDeliveryZones);
      const savedLogo = localStorage.getItem('cv_logo');
      if (savedLogo) setLogoUrl(savedLogo);
      const savedColor = localStorage.getItem('cv_color');
      if (savedColor) setPrimaryColor(savedColor);

      // Restore token and set on apiService
      const savedToken = localStorage.getItem('cv_token');
      if (savedToken) {
        setToken(savedToken);
        apiService.setToken(savedToken);
      }

      // Fetch real data from Neon
      try {
        const savedUser = localStorage.getItem('cv_user');
        const currentUser = savedUser ? JSON.parse(savedUser) : null;
        const isAdmin = currentUser?.role === 'Admin';

        const fetches: Promise<unknown>[] = [
          apiService.getProducts(),
          apiService.getPosts(1, 20),
          // users et orders sont admin-only
          isAdmin ? apiService.getUsers()  : Promise.resolve(null),
          isAdmin ? apiService.getOrders() : Promise.resolve(null),
        ];

        const [realProducts, realPosts, realUsers, realOrders] = await Promise.allSettled(fetches);

        if (realProducts.status === 'fulfilled' && realProducts.value) setProducts(realProducts.value as Product[]);
        if (realPosts.status    === 'fulfilled' && realPosts.value)    setPosts(realPosts.value as Post[]);
        if (realUsers.status    === 'fulfilled' && realUsers.value)    setUsers(realUsers.value as UserProfile[]);
        if (realOrders.status   === 'fulfilled' && realOrders.value)   setOrders(realOrders.value as Order[]);
      } catch (err) {
        console.error("Backend fetch error:", err);
      }
      
      setIsLoading(false);
    };
    
    load();
  }, []);

  // Split localStorage persistence into focused effects
  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_cart', JSON.stringify(cart));
  }, [cart, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_user', JSON.stringify(user));
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_users_list', JSON.stringify(users));
  }, [users, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_likes', JSON.stringify(likedPosts));
  }, [likedPosts, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_fav_posts', JSON.stringify(favoritePosts));
  }, [favoritePosts, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_fav_prods', JSON.stringify(favoriteProducts));
  }, [favoriteProducts, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cv_logo', logoUrl);
      localStorage.setItem('cv_color', primaryColor);
      localStorage.setItem('cv_zones', JSON.stringify(deliveryZones));
      if (token) localStorage.setItem('cv_token', token);
      else localStorage.removeItem('cv_token');
      document.documentElement.style.setProperty('--primary-theme', primaryColor);
    }
  }, [logoUrl, primaryColor, deliveryZones, token, isLoading]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, price: Number(product.price) }];
    });
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

  const deleteProduct = useCallback(async (id: number) => {
    // Mettre à jour le state immédiatement (optimistic update)
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deleteProduct(id);
    } catch (err) { console.error(err); }
  }, []);

  const deletePost = useCallback(async (id: number) => {
    // Mettre à jour le state immédiatement (optimistic update)
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deletePost(id);
    } catch (err) { console.error(err); }
  }, []);
  
  const approveUser = useCallback(async (id: number) => {
    try {
      await apiService.updateUser({ id, is_approved: true });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
    } catch (err) { console.error(err); }
  }, []);

  const banUser = useCallback(async (id: number) => {
    try {
      await apiService.updateUser({ id, status: 'Banni' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Banni' } : u));
    } catch (err) { console.error(err); }
  }, []);
  
  const toggleLike = useCallback(async (postId: number) => {
    if (user.isGuest) return;
    try {
      await apiService.toggleLike(postId, user.handle);
      setLikedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
    } catch (err) { console.error(err); }
  }, [user.isGuest, user.handle]);

  const toggleFavoritePost = useCallback((postId: number) => setFavoritePosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]), []);
  const toggleFavoriteProduct = useCallback((productId: number) => setFavoriteProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]), []);
  
  const toggleFollow = useCallback(async (handle: string) => {
    if (user.isGuest) return;
    try {
      await apiService.toggleFollow(user.handle, handle);
      setUser(prev => {
        const currentFollowing = prev.following || [];
        const isFollowing = currentFollowing.includes(handle);
        return {
          ...prev,
          following: isFollowing 
            ? currentFollowing.filter(h => h !== handle) 
            : [...currentFollowing, handle]
        };
      });
    } catch (err) { console.error(err); }
  }, [user.isGuest, user.handle]);

  // Wrap remaining functions in useCallback
  const removeFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const updateUser = useCallback(async (data: Partial<UserProfile>) => {
    try {
      if (user.id) await apiService.updateUser({ id: user.id, ...data });
      setUser(prev => ({ ...prev, ...data }));
    } catch (err) { console.error(err); }
  }, [user.id]);

  const addProduct = useCallback((p: AddProductInput) => {
    setProducts(prev => [...prev, { ...p, id: Date.now() }]);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiService.login(credentials);
      setToken(data.token);
      apiService.setToken(data.token);
      setUser({ ...data.user, isAuthenticated: true, isGuest: false, following: data.user.following || [] });
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  }, []);

  const adminLogin = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiService.adminLogin(credentials);
      setToken(data.token);
      apiService.setToken(data.token);
      setUser({ ...data.user, isAuthenticated: true, isGuest: false, following: data.user.following || [] });
      return true;
    } catch (err) {
      console.error("Admin login failed:", err);
      return false;
    }
  }, []);

  const setGuestMode = useCallback(() => {
    setUser({ id: -1, name: "Visiteur", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Guest', isApproved: true, isAuthenticated: false, isGuest: true, status: 'Actif', following: [] });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser({ id: 0, name: "Invité", handle: "@guest", bio: "", avatarColor: primaryColor, role: 'Guest', isApproved: false, isAuthenticated: false, isGuest: true, status: 'Actif', following: [] });
  }, [primaryColor]);

  const updateLogo = useCallback((url: string) => setLogoUrl(url), []);
  const updatePrimaryColor = useCallback((color: string) => setPrimaryColor(color), []);
  const updateDeliveryZones = useCallback((zones: DeliveryZone[]) => setDeliveryZones(zones), []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    user, users, products, posts, orders,
    updateUser, approveUser, banUser, addProduct, deleteProduct, deletePost, addOrder,
    login, adminLogin, setGuestMode, logout,
    likedPosts, favoritePosts, favoriteProducts, toggleLike, toggleFavoritePost, toggleFavoriteProduct, toggleFollow, 
    isLoading, logoUrl, updateLogo, primaryColor, updatePrimaryColor,
    deliveryZones, updateDeliveryZones
  }), [
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    user, users, products, posts, orders,
    updateUser, approveUser, banUser, addProduct, deleteProduct, deletePost, addOrder,
    login, adminLogin, setGuestMode, logout,
    likedPosts, favoritePosts, favoriteProducts, toggleLike, toggleFavoritePost, toggleFavoriteProduct, toggleFollow,
    isLoading, logoUrl, updateLogo, primaryColor, updatePrimaryColor,
    deliveryZones, updateDeliveryZones
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
export { AppContext };