"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Trash2, Plus, Minus, CreditCard, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, primaryColor } = useApp();

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <MainLayout>
      <header className="p-6 flex items-center justify-center">
        <h1 className="text-2xl font-black text-gray-800">MON PANIER</h1>
      </header>

      <div className="px-6 space-y-6 pb-10">
        {cart.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="bg-pink-50 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto text-pink-400">
              <ShoppingBag size={40} />
            </div>
            <p className="text-gray-400 font-bold">Ton panier est vide...</p>
            <Button onClick={() => navigate('/shop')} className="bg-pink-500 rounded-2xl" style={{ backgroundColor: primaryColor }}>
              Aller à la boutique
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 bg-white p-4 rounded-3xl border border-pink-50 shadow-sm">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-pink-50">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-black text-theme text-xs" style={{ color: primaryColor }}>{item.price.toLocaleString()} GNF</span>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-theme" style={{ color: primaryColor }}><Minus size={16} /></button>
                        <span className="font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-theme" style={{ color: primaryColor }}><Plus size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Sous-total</span>
                <span>{total.toLocaleString()} GNF</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Livraison</span>
                <span>Gratuit</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-lg font-black text-gray-900">
                <span>TOTAL</span>
                <span className="text-theme" style={{ color: primaryColor }}>{total.toLocaleString()} GNF</span>
              </div>
            </div>

            <Button 
              onClick={() => navigate('/checkout')}
              className="w-full h-14 rounded-2xl bg-theme hover:opacity-90 text-white text-lg font-black shadow-lg flex gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <CreditCard size={20} />
              PASSER À LA CAISSE
            </Button>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Cart;