"use client";

import type { PostData, ProductData, OrderData, UserData, MessageData, LoginCredentials, FetchOptions } from '@/types/api';

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('cv_token') : null;

// Mock data for local development when API is not available
const MOCK_USER = {
  id: 1,
  email: 'user@example.com',
  name: 'Test User',
  handle: '@testuser',
  role: 'Member',
  is_approved: true,
  isApproved: true,
  status: 'Actif',
  bio: 'Test user for local development',
  avatarColor: '#94a3b8',
  following: []
};

const MOCK_PRODUCTS = [
  { id: 1, name: "T-Shirt Chibi Vulture", price: 250000, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=300", category: "Vêtements", stock: 15, featured: true },
  { id: 2, name: "Stickers Pack Kawaii", price: 125000, image: "https://images.unsplash.com/photo-1572375927902-d60e60ad1710?q=80&w=300", category: "Accessoires", stock: 5, featured: false },
];

const MOCK_POSTS = [
  { id: 1, user: "ChibiMomo", handle: "@momo", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Momo", image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=600", likes: 124, caption: "Mon premier dessin ! ✨", time: "2h", reports: 0 },
  { id: 2, user: "VultureKing", handle: "@king", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King", image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=600", likes: 89, caption: "Style Vulture activé 🦅", time: "5h", reports: 2 },
];

// Flag to use mock data in local development
const USE_MOCK_DATA = true;

const fetchWithAuth = async (url: string, options: FetchOptions = {}) => {
  const headers: Record<string, string> = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid — clear it
    authToken = null;
    if (typeof window !== 'undefined') localStorage.removeItem('cv_token');
  }

  return response;
};

const safeJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const apiService = {
  setToken: (token: string | null) => {
    authToken = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('cv_token', token);
      else localStorage.removeItem('cv_token');
    }
  },

  getPosts: async (page = 1, limit = 10) => {
    if (USE_MOCK_DATA) {
      return MOCK_POSTS;
    }
    const response = await fetchWithAuth(`/api/posts?page=${page}&limit=${limit}`);
    return safeJson(response);
  },

  createPost: async (postData: PostData) => {
    const response = await fetchWithAuth('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return safeJson(response);
  },

  deletePost: async (id: number) => {
    const response = await fetchWithAuth(`/api/posts?id=${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
  },

  getProducts: async () => {
    if (USE_MOCK_DATA) {
      return MOCK_PRODUCTS;
    }
    const response = await fetchWithAuth('/api/products');
    return safeJson(response);
  },

  addProduct: async (productData: ProductData) => {
    const response = await fetchWithAuth('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to add product');
    return safeJson(response);
  },

  deleteProduct: async (id: number) => {
    const response = await fetchWithAuth(`/api/products?id=${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete product');
  },

  createOrder: async (orderData: OrderData & { id: string }) => {
    const response = await fetchWithAuth('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: orderData.id,
        customer_name: orderData.customer,
        // total is sent for delivery fee calculation — server recomputes from DB prices
        total: orderData.total,
        items: orderData.items,
      }),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Failed to create order');
    }
    return safeJson(response);
  },

  getOrders: async () => {
    if (USE_MOCK_DATA) {
      return [];
    }
    const response = await fetchWithAuth('/api/orders');
    return safeJson(response);
  },

  toggleLike: async (post_id: number, user_handle: string) => {
    const response = await fetchWithAuth('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ post_id, user_handle }),
    });
    return safeJson(response);
  },

  getLikedPosts: async (user_handle: string) => {
    const response = await fetchWithAuth(`/api/likes?user_handle=${encodeURIComponent(user_handle)}`);
    return safeJson(response);
  },

  toggleFollow: async (follower_handle: string, following_handle: string) => {
    const response = await fetchWithAuth('/api/follows', {
      method: 'POST',
      body: JSON.stringify({ follower_handle, following_handle }),
    });
    return safeJson(response);
  },

  getFollowers: async (handle: string) => {
    const response = await fetchWithAuth(`/api/follows?handle=${encodeURIComponent(handle)}`);
    return safeJson(response);
  },

  getUsers: async () => {
    if (USE_MOCK_DATA) {
      return [MOCK_USER];
    }
    const response = await fetchWithAuth('/api/users');
    return safeJson(response);
  },

  updateUser: async (userData: UserData) => {
    const response = await fetchWithAuth('/api/users', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return safeJson(response);
  },

  createUser: async (userData: UserData) => {
    if (USE_MOCK_DATA) {
      // Simulate successful user creation with mock data
      return {
        ...MOCK_USER,
        ...userData,
        id: Date.now(),
        isAuthenticated: true,
        isGuest: false
      };
    }
    const response = await fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Failed to create user');
    }
    return safeJson(response);
  },

  sendMessage: async (messageData: MessageData) => {
    const response = await fetchWithAuth('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return safeJson(response);
  },

  getMessages: async (user1: string, user2: string) => {
    const response = await fetchWithAuth(
      `/api/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    );
    return safeJson(response);
  },

  getUserPostCount: async (handle: string) => {
    const response = await fetchWithAuth(`/api/posts?handle=${encodeURIComponent(handle)}`);
    return safeJson(response);
  },

  getFollowCounts: async (handle: string) => {
    const response = await fetchWithAuth(`/api/follows?handle=${encodeURIComponent(handle)}`);
    return safeJson(response);
  },

  getNotifications: async () => {
    const response = await fetchWithAuth('/api/notifications');
    return safeJson(response);
  },

  search: async (query: string) => {
    const response = await fetchWithAuth(`/api/search?q=${encodeURIComponent(query)}`);
    return safeJson(response);
  },

  getConversations: async () => {
    const response = await fetchWithAuth('/api/conversations');
    return safeJson(response);
  },

  login: async (credentials: LoginCredentials) => {
    if (USE_MOCK_DATA) {
      // Simulate successful login with mock data
      return {
        token: 'mock-token-' + Date.now(),
        user: {
          ...MOCK_USER,
          ...credentials,
          isAuthenticated: true,
          isGuest: false
        }
      };
    }
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Identifiants incorrects');
    }
    return safeJson(response);
  },

  // Push notifications
  getVapidPublicKey: async () => {
    const response = await fetchWithAuth('/api/push-subscribe');
    return safeJson(response);
  },

  subscribeToPush: async (subscription: PushSubscription) => {
    const response = await fetchWithAuth('/api/push-subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });
    if (!response.ok) throw new Error('Failed to subscribe to push notifications');
    return safeJson(response);
  },

  unsubscribeFromPush: async () => {
    const response = await fetchWithAuth('/api/push-subscribe', {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to unsubscribe from push notifications');
    return safeJson(response);
  },

  // Admin Push Notifications
  getPushStats: async () => {
    const response = await fetchWithAuth('/api/admin-push-stats');
    if (!response.ok) throw new Error('Failed to get push stats');
    return safeJson(response);
  },

  sendPushNotification: async ({ title, body, url }: { title: string; body: string; url?: string }) => {
    const response = await fetchWithAuth('/api/admin-push-notify', {
      method: 'POST',
      body: JSON.stringify({ title, body, url }),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Failed to send push notification');
    }
    return safeJson(response);
  },

  // App Settings
  getAppSettings: async () => {
    const response = await fetch('/api/app-settings');
    return safeJson(response);
  },

  updateAppSettings: async (settings: { app_name?: string; app_logo?: string; app_description?: string; primary_color?: string }) => {
    const response = await fetchWithAuth('/api/app-settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update app settings');
    return safeJson(response);
  },

  adminLogin: async (credentials: LoginCredentials) => {
    // Admin login is fully server-side authenticated
    // Credentials are validated in api/admin-login.js using environment variables
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Accès admin refusé');
    }

    return safeJson(response);
  },
};
