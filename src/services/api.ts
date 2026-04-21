"use client";

import type { PostData, ProductData, OrderData, UserData, MessageData, LoginCredentials, FetchOptions } from '@/types/api';

let authToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('cv_token') : null;

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
    authToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cv_token');
      sessionStorage.removeItem('cv_user');
    }
  }

  return response;
};

const safeJson = async (response: Response) => {
  try {
    const data = await response.json();
    // If the server returned an error object, don't treat it as valid data
    if (!response.ok) return null;
    return data;
  } catch {
    return null;
  }
};

export const apiService = {
  setToken: (token: string | null) => {
    authToken = token;
    if (typeof window !== 'undefined') {
      if (token) sessionStorage.setItem('cv_token', token);
      else {
        sessionStorage.removeItem('cv_token');
        sessionStorage.removeItem('cv_user');
      }
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

  createOrder: async (orderData: OrderData & { id: string; phone?: string; shipping_address?: string }) => {
    const response = await fetchWithAuth('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: orderData.id,
        customer_name: orderData.customer,
        total: orderData.total,
        items: orderData.items,
        phone: orderData.phone,
        shipping_address: orderData.shipping_address,
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

  logout: async () => {
    try {
      await fetchWithAuth('/api/logout', { method: 'POST' });
    } catch { /* silent — on déconnecte quand même */ }
    authToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cv_token');
      sessionStorage.removeItem('cv_user');
    }
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

getOrderTracking: async (orderId: string) => {
  const response = await fetchWithAuth(`/api/orders/${orderId}/tracking`);
  if (!response.ok) throw new Error('Failed to get order tracking');
  return safeJson(response);
},

getArtistStats: async (artistId: number, period: 'week' | 'month' | 'year' = 'month') => {
  const response = await fetchWithAuth(`/api/artist-stats?artist_id=${artistId}&period=${period}`);
  if (!response.ok) throw new Error('Failed to get artist stats');
  return safeJson(response);
},

getProductCategories: async () => {
  const response = await fetch('/api/product-categories');
  if (!response.ok) throw new Error('Failed to get product categories');
  return safeJson(response);
},

createProductCategory: async (category: { name: string; description?: string; icon?: string; color?: string }) => {
  const response = await fetchWithAuth('/api/product-categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error('Failed to create category');
  return safeJson(response);
},

updateDeliveryTracking: async (data: {
  order_id: number;
  status: string;
  description: string;
  location?: string;
  carrier?: string;
  tracking_number?: string;
}) => {
  const response = await fetchWithAuth('/api/delivery-tracking', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update delivery tracking');
  return safeJson(response);
},

};
