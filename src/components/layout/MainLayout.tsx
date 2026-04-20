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
    <div className="min-h-screen bg-[#FDFCFD] pb-24 font-sans selection:bg-pink-100 overflow-x-hidden">
      <div className="w-full sm:max-w-2xl mx-auto bg-white min-h-screen shadow-[0_0_50px_rgba(0,0,0,0.02)] relative sm:border-x border-gray-50">
        
        <SmartHeader />

        {/* Background decorative elements */}
        <div className="absolute top-[-5%] right-[-10%] w-80 h-80 bg-gradient-to-br from-pink-50 to-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-[15%] left-[-15%] w-64 h-64 bg-gradient-to-tr from-blue-50 to-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "relative z-10",
            !isHome && "pt-24" // Augmentation du padding pour le header flottant
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