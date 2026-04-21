// Mobile API Service for Chibi Vulture
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration - Change this to your production URL
const API_BASE_URL = 'https://chibi-vulture.vercel.app';

let authToken: string | null = null;

// Load token from storage on init
AsyncStorage.getItem('cv_token').then((token: string | null) => {
  authToken = token;
});

const fetchWithAuth = async (url: string, options: any = {}) => {
  const headers: Record<string, string> = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401) {
    authToken = null;
    await AsyncStorage.removeItem('cv_token');
    await AsyncStorage.removeItem('cv_user');
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
  setToken: async (token: string | null) => {
    authToken = token;
    if (token) {
      await AsyncStorage.setItem('cv_token', token);
    } else {
      await AsyncStorage.removeItem('cv_token');
      await AsyncStorage.removeItem('cv_user');
    }
  },

  getToken: () => authToken,

  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Identifiants incorrects');
    }
    return safeJson(response); // returns { otpRequired: true }
  },

  verifyLoginOtp: async (credentials: { email: string; code: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/login-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Code invalide ou expiré');
    }
    const data = await safeJson(response);
    if (data.token) {
      await apiService.setToken(data.token);
      await AsyncStorage.setItem('cv_user', JSON.stringify(data.user));
    }
    return data;
  },

  signup: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Erreur lors de l\'inscription');
    }
    const data = await safeJson(response);
    return data;
  },

  logout: async () => {
    await apiService.setToken(null);
  },

  getCurrentUser: async () => {
    const userJson = await AsyncStorage.getItem('cv_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  // Posts
  getPosts: async (page = 1, limit = 10) => {
    const response = await fetchWithAuth(`/api/posts?page=${page}&limit=${limit}`);
    return safeJson(response);
  },

  createPost: async (postData: any) => {
    const response = await fetchWithAuth('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return safeJson(response);
  },

  likePost: async (post_id: number, user_handle: string) => {
    const response = await fetchWithAuth('/api/likes', {
      method: 'POST',
      body: JSON.stringify({ post_id, user_handle }),
    });
    return safeJson(response);
  },

  // Products
  getProducts: async () => {
    const response = await fetchWithAuth('/api/products');
    return safeJson(response);
  },

  getProductCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/api/product-categories`);
    return safeJson(response);
  },

  // Orders
  createOrder: async (orderData: any) => {
    const response = await fetchWithAuth('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const err = await safeJson(response);
      throw new Error(err?.error || 'Failed to create order');
    }
    return safeJson(response);
  },

  getOrders: async () => {
    const response = await fetchWithAuth('/api/orders?mine=1');
    return safeJson(response);
  },

  getOrderDetail: async (id: number) => {
    const response = await fetchWithAuth(`/api/orders?id=${id}`);
    return safeJson(response);
  },

  // Password reset
  forgotPassword: async (email: string) => {
    await fetch(`${API_BASE_URL}/api/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  // Users
  getUsers: async () => {
    const response = await fetchWithAuth('/api/users');
    return safeJson(response);
  },

  updateUser: async (userData: any) => {
    const response = await fetchWithAuth('/api/users', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    const data = await safeJson(response);
    await AsyncStorage.setItem('cv_user', JSON.stringify(data));
    return data;
  },

  // Follows
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

  // Messages
  getConversations: async () => {
    const response = await fetchWithAuth('/api/conversations');
    return safeJson(response);
  },

  getMessages: async (user1: string, user2: string) => {
    const response = await fetchWithAuth(
      `/api/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    );
    return safeJson(response);
  },

  sendMessage: async (messageData: any) => {
    const response = await fetchWithAuth('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return safeJson(response);
  },

  // Search
  search: async (query: string) => {
    const response = await fetchWithAuth(`/api/search?q=${encodeURIComponent(query)}`);
    return safeJson(response);
  },

  // App Settings
  getAppSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/api/app-settings`);
    return safeJson(response);
  },

  // User Stats
  getUserPostCount: async (handle: string) => {
    const response = await fetchWithAuth(`/api/posts?handle=${encodeURIComponent(handle)}`);
    return safeJson(response);
  },
};
