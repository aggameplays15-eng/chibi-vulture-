"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Bell, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import MobileMenu from './MobileMenu';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/services/api';

const SmartHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, headerLogoUrl, primaryColor, user } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    if (!user.isAuthenticated || user.isGuest) return;
    const fetchCount = () => {
      apiService.getNotifications()
        .then((data: { id: number }[] | null) => { if (Array.isArray(data)) setUnreadCount(Math.min(data.length, 99)); })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user.isAuthenticated, user.isGuest]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return "Fil d'actu";
    if (path.startsWith('/explore')) return "Découvrir";
    if (path.startsWith('/shop')) return "Boutique";
    if (path.startsWith('/cart')) return "Mon Panier";
    if (path.startsWith('/profile')) return "Profil";
    if (path.startsWith('/messages')) return "Messages";
    if (path.startsWith('/goated-panel')) return "Admin";
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
          "glass rounded-[28px] py-2 px-3 flex items-center justify-between gap-2",
          scrolled ? "shadow-xl scale-[0.98]" : "shadow-md"
        )}
      >
        <div className="flex items-center gap-1">
          {!isFeed ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
              onClick={() => {
                if (window.history.length <= 2) {
                  navigate('/feed');
                } else {
                  navigate(-1);
                }
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </Button>
          ) : (
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm cursor-pointer active:scale-90 transition-transform overflow-hidden bg-white dark:bg-white/5"
              onClick={() => navigate('/feed')}
            >
              <img src={headerLogoUrl} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
          )}
        </div>

        <div className="flex-1 px-2">
          <h1 className="font-black text-xs text-gray-900 dark:text-white tracking-tight uppercase text-center">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 relative"
            onClick={() => { navigate('/notifications'); setUnreadCount(0); }}
          >
            <Bell size={18} strokeWidth={2} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[hsl(224,20%,9%)]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={18} strokeWidth={2} />
            <AnimatePresence>
              {cart.length > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[hsl(224,20%,9%)]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          
          <div className="w-px h-5 bg-gray-100 dark:bg-white/8 mx-1" />
          
          <MobileMenu />
        </div>
      </motion.header>
    </div>
  );
};

export default SmartHeader;