"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface ProductInput {
  id: number;
  name: string;
  price: number | string;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductInput) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('cv_cart');
    if (savedCart) setCart(JSON.parse(savedCart) as CartItem[]);
  }, []);

  useEffect(() => {
    localStorage.setItem('cv_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product: ProductInput) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, price: Number(product.price) }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const contextValue = useMemo(() => ({
    cart, addToCart, removeFromCart, updateQuantity, clearCart
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
