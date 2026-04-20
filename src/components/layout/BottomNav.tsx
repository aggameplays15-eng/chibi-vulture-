"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, PlusSquare, User, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const BottomNav = () => {
  const location = useLocation();
  const { user, primaryColor } = useApp();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const hiddenRoutes = ['/chat', '/onboarding', '/login', '/signup', '/checkout-success'];
  const isHiddenRoute = hiddenRoutes.some(route => location.pathname.startsWith(route));

  if (isHiddenRoute) return null;

  const navItems = [
    { icon: Home, label: 'Feed', path: '/feed' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Post', path: '/create' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.nav
          initial={{ y: 100, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-6 left-1/2 w-[94%] max-w-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.12)] px-2 py-2 z-50 flex justify-around items-center rounded-[35px]"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[60px] h-14 transition-all duration-300",
                  isActive ? "text-theme" : "text-gray-400 hover:text-gray-600"
                )}
                style={{ color: isActive ? primaryColor : undefined }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active-bg"
                      className="absolute inset-0 rounded-[24px] -z-10"
                      style={{ backgroundColor: `${primaryColor}15` }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
                
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1], y: -2 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider mt-1 transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"
                )}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </Link>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;