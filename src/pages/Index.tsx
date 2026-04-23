"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Eye, Zap, ShoppingBag, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const FEATURES = [
  { icon: Zap, label: "Feed en temps reel" },
  { icon: ShoppingBag, label: "Boutique integree" },
  { icon: Users, label: "Communaute" },
];

const BookLogo = ({ logoUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const rotateX = useMotionValue(15);
  const rotateY = useMotionValue(-20);
  
  // Increased stiffness and damping for a more premium, responsive feel
  const springX = useSpring(rotateX, { stiffness: 120, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 30 });

  // Use animation frame for perfectly fluid rotation
  useAnimationFrame((time, delta) => {
    if (isDragging) return;
    
    // Constant rotation speed (approx 0.4 degrees per frame at 60fps)
    rotateY.set(rotateY.get() + delta * 0.025);
    // Subtle vertical oscillation
    rotateX.set(12 + Math.sin(time / 1000) * 6);
  });

  const onPan = (e, info) => {
    rotateY.set(rotateY.get() + info.delta.x * 0.4);
    rotateX.set(rotateX.get() - info.delta.y * 0.4);
  };

  return (
    <div className="relative perspective-[1200px] cursor-grab active:cursor-grabbing touch-none select-none">
      <motion.div
        onPanStart={() => setIsDragging(true)}
        onPanEnd={() => setIsDragging(false)}
        onPan={onPan}
        style={{ 
          rotateX: springX, 
          rotateY: springY, 
          transformStyle: "preserve-3d" 
        }}
        className="relative w-[280px] h-[280px] flex items-center justify-center"
      >
        {/* Single high-quality logo with clean depth-simulating shadow */}
        <motion.img
          src={logoUrl}
          alt="Chibi Vulture Logo"
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
          style={{ transform: "translateZ(20px)" }}
        />
      </motion.div>

      {/* Simplified subtle floor shadow */}
      <motion.div
        style={{ 
          opacity: 0.1,
          scale: 0.8,
          rotateX: 90,
          transform: "translateY(160px) translateZ(-40px)",
        }}
        className="absolute inset-0 w-[220px] h-[20px] left-1/2 -translate-x-1/2 rounded-full blur-2xl bg-black"
      />
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { user, homeLogoUrl, primaryColor, setGuestMode, isLoading } = useApp();

  React.useEffect(() => {
    if (!isLoading && user?.isAuthenticated && !user?.isGuest) {
      navigate('/feed', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleGuest = () => { setGuestMode(); navigate("/feed"); };
  
  return (
    <div className="h-screen h-[100dvh] bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="relative z-10 text-center space-y-10 md:space-y-16 max-w-sm w-full flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center gap-8 relative"
        >
          <BookLogo logoUrl={homeLogoUrl} />
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85]">
              CHIBI<br />
              <span style={{ color: primaryColor }}>VULTURE</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em]">
              Community for Artists
            </p>
          </div>
        </motion.div>

        <div className="space-y-4 w-full">
          <Link to="/login" className="block">
            <Button 
              className="w-full h-16 rounded-[32px] text-white text-lg font-black shadow-lg transition-all active:scale-95 flex gap-3 group" 
              style={{ backgroundColor: primaryColor }}
            >
              SE CONNECTER 
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/signup">
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-3xl text-gray-800 dark:text-gray-200 text-xs font-black border-gray-100 dark:border-white/10 hover:bg-gray-50 transition-all"
              >
                S'INSCRIRE
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              onClick={handleGuest} 
              className="w-full h-14 rounded-3xl bg-gray-50 dark:bg-white/5 text-gray-500 text-xs font-black hover:bg-gray-100 transition-all flex gap-2"
            >
              INVITÉ <Eye size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
