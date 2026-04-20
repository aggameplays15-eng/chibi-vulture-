"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Bell, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MobileMenu from './MobileMenu';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SmartHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, logoUrl, primaryColor } = useApp();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return "Fil d'actu";
    if (path.startsWith('/explore')) return "Découvrir";
    if (path.startsWith('/shop')) return "Boutique";
    if (path.startsWith('/cart')) return "Mon Panier";
    if (path.startsWith('/profile')) return "Profil";
    if (path.startsWith('/messages')) return "Messages";
    if (path.startsWith('/admin')) return "Admin";
    if (path.startsWith('/settings')) return "Réglages";
    return "Chibi Vulture";
  };

  const isHome = location.pathname === '/';
  const isFeed = location.pathname === '/feed';

  if (isHome) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none flex justify-center">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "w-full sm:max-w-xl pointer-events-auto transition-all duration-500 ease-in-out",
          "glass rounded-[32px] py-2 px-3 flex items-center justify-between gap-2",
          scrolled ? "shadow-lg scale-[0.98]" : "shadow-sm"
        )}
      >
        <div className="flex items-center gap-1">
          {!isFeed ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full hover:bg-gray-50 text-gray-600"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Button>
          ) : (
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform overflow-hidden bg-white"
              onClick={() => navigate('/feed')}
            >
              <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
          )}
        </div>

        <div className="flex-1 px-2">
          <h1 className="font-black text-xs text-gray-900 tracking-tight uppercase text-center">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full text-gray-400 hover:text-gray-900 relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={18} strokeWidth={2} />
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          
          <div className="w-px h-6 bg-gray-100 mx-1" />
          
          <MobileMenu />
        </div>
      </motion.header>
    </div>
  );
};

export default SmartHeader;