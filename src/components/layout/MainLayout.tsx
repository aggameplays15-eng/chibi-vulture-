"use client";

import React from 'react';
import BottomNav from './BottomNav';
import SmartHeader from './SmartHeader';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[hsl(224,20%,7%)] font-sans selection:bg-pink-100 dark:selection:bg-pink-900/30 overflow-x-hidden">
      <div className="w-full sm:max-w-2xl mx-auto bg-white dark:bg-[hsl(224,20%,9%)] min-h-screen shadow-[0_0_60px_rgba(0,0,0,0.03)] dark:shadow-none relative sm:border-x border-gray-50 dark:border-white/5">
        
        <SmartHeader />

        {/* Subtle background blobs */}
        <div className="absolute top-0 right-[-5%] w-72 h-72 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-10%] w-56 h-56 bg-gradient-to-tr from-blue-50 to-pink-50 dark:from-blue-950/20 dark:to-pink-950/20 rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "relative z-10",
            !isHome && "pt-24"
          )}
        >
          {children}
        </motion.main>
        
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;