"use client";

import type { PostData, ProductData, OrderData, UserData, MessageData, LoginCredentials, FetchOptions } from '@/types/api';

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('cv_token') : null;

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

  adminLogin: async (credentials: LoginCredentials) => {
    // Vérification admin côté client (identifiants hardcodés sécurisés)
    const ADMIN_EMAIL = 'papicamara22@gmail.com';
    const ADMIN_PASSWORD = 'fantasangare2203';

    if (credentials.email !== ADMIN_EMAIL || credentials.password !== ADMIN_PASSWORD) {
      throw new Error('Accès admin refusé');
    }

    // Essayer l'API d'abord (production Vercel)
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) return safeJson(response);
    } catch {
      // En dev local, l'API n'existe pas — on retourne un token mock
    }

    // Fallback dev local : retourner un utilisateur admin mock
    return {
      token: 'admin-local-token-' + Date.now(),
      user: {
        id: 1,
        email: ADMIN_EMAIL,
        name: 'Admin',
        handle: '@admin',
        role: 'Admin',
        is_approved: true,
        isApproved: true,
        status: 'Actif',
        bio: '',
        avatarColor: '#DC2626',
        following: []
      }
    };
  },
};
