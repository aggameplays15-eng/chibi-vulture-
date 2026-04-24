// API Types

export interface PostData {
  image: string;
  caption: string;
}

export interface CommentData {
  post_id: number;
  text: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_handle: string;
  user_name?: string;
  user_avatar?: string;
  text: string;
  created_at: string;
}

export interface ProductData {
  name: string;
  price: number;
  image: string;
  category: string;
  stock?: number;
  featured?: boolean;
  description?: string;
}

export interface OrderData {
  customer: string;
  total: number;
  items: OrderItem[];
  customer_id?: number;
  phone?: string;
  shipping_address?: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface UserData {
  id?: number;
  name?: string;
  handle?: string;
  email?: string;
  bio?: string;
  avatarColor?: string;
  password?: string;
  role?: string;
  isApproved?: boolean;
  is_approved?: boolean;
  status?: string;
}

export interface MessageData {
  receiver_handle: string;
  text: string;
  sender_handle?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}
