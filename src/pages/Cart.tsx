"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, primaryColor, deliveryZones } = useApp();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  // Livraison calculée au checkout — on affiche juste "calculée à l'étape suivante"
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <MainLayout>
      <header className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">MON PANIER</h1>
        {cart.length > 0 && (
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: primaryColor }}>
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div className="px-6 space-y-5 pb-10">
        {cart.length === 0 ? (
          <div className="text-center py-20 space-y-5">
            <div className="w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${primaryColor}15` }}>
              <ShoppingBag size={40} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="font-black text-gray-800 dark:text-white text-lg">Panier vide</p>
              <p className="text-sm text-gray-400 mt-1">Découvre nos produits dans la boutique</p>
            </div>
            <Button onClick={() => navigate('/shop')} className="rounded-2xl text-white font-black h-12 px-8"
              style={{ backgroundColor: primaryColor }}>
              Aller à la boutique
            </Button>
          </div>
        ) : (
          <>
            {/* Articles */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id}
                  className="flex gap-4 bg-white dark:bg-[hsl(224,20%,10%)] p-4 rounded-3xl border border-gray-50 dark:border-white/5 shadow-sm">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <button onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-black text-sm" style={{ color: primaryColor }}>
                        {(item.price * item.quantity).toLocaleString('fr-FR')} GNF
                      </span>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500">
                          <Minus size={13} />
                        </button>
                        <span className="font-black text-sm w-5 text-center text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          style={{ color: primaryColor }}>
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Récap */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-5 space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
                <span>{subtotal.toLocaleString('fr-FR')} GNF</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Livraison</span>
                <span className="text-orange-500">Calculée à l'étape suivante</span>
              </div>
              <div className="h-px bg-gray-200 dark:bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="font-black text-gray-900 dark:text-white">Sous-total</span>
                <span className="text-lg font-black" style={{ color: primaryColor }}>
                  {subtotal.toLocaleString('fr-FR')} GNF
                </span>
              </div>
            </div>

            <Button onClick={() => navigate('/checkout')}
              className="w-full h-14 rounded-2xl text-white text-base font-black shadow-lg flex gap-2"
              style={{ backgroundColor: primaryColor }}>
              PASSER À LA CAISSE
              <ArrowRight size={20} />
            </Button>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Cart;
