"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Eye, Zap, ShoppingBag, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const FEATURES = [
  { icon: Zap, label: "Feed en temps reel" },
  { icon: ShoppingBag, label: "Boutique integree" },
  { icon: Users, label: "Communaute" },
];

const Particle = ({ color, index, total }) => {
  const duration = 12 + Math.random() * 8;
  const radius = 170 + Math.random() * 60;
  return (
    <motion.div
      animate={{ rotate: [0, 360], scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
      transition={{ rotate: { duration, repeat: Infinity, ease: "linear" }, scale: { duration: duration / 3, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: duration / 2, repeat: Infinity, ease: "easeInOut" } }}
      className="absolute pointer-events-none"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <div className="w-1.5 h-1.5 rounded-full blur-[2px]" style={{ backgroundColor: color, boxShadow: "0 0 15px " + color, transform: "translate(" + radius + "px, 0)" }} />
    </motion.div>
  );
};

const BookLogo = ({ logoUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const rotateX = useMotionValue(15);
  const rotateY = useMotionValue(-20);
  
  const springX = useSpring(rotateX, { stiffness: 60, damping: 25 });
  const springY = useSpring(rotateY, { stiffness: 60, damping: 25 });

  // Floating animation when not dragging
  useEffect(() => {
    if (isDragging) return;
    
    const interval = setInterval(() => {
      rotateY.set(rotateY.get() + 0.4);
      rotateX.set(15 + Math.sin(Date.now() / 1000) * 10);
    }, 16);
    
    return () => clearInterval(interval);
  }, [isDragging, rotateX, rotateY]);

  const onPan = (e, info) => {
    rotateY.set(rotateY.get() + info.delta.x * 0.5);
    rotateX.set(rotateX.get() - info.delta.y * 0.5);
  };

  return (
    <div className="relative perspective-[1500px] cursor-grab active:cursor-grabbing touch-none select-none">
      <motion.div
        onPanStart={() => setIsDragging(true)}
        onPanEnd={() => setIsDragging(false)}
        onPan={onPan}
        style={{ 
          rotateX: springX, 
          rotateY: springY, 
          transformStyle: "preserve-3d" 
        }}
        className="relative w-[280px] h-[280px] flex items-center justify-center transition-shadow"
      >
        {/* Layered thickness effect (10 layers for depth) */}
        {[...Array(10)].map((_, i) => (
          <motion.img
            key={i}
            src={logoUrl}
            alt=""
            className="absolute w-full h-full object-contain pointer-events-none"
            style={{ 
              transform: `translateZ(${i - 5}px)`,
              opacity: i === 9 || i === 0 ? 1 : 0.2,
              filter: i < 9 ? `brightness(${0.5 + i * 0.05}) blur(0.5px)` : "none",
              zIndex: i
            }}
          />
        ))}
        
        {/* Glow effect inside */}
        <div 
          className="absolute inset-4 rounded-full blur-[40px] opacity-20 pointer-events-none"
          style={{ backgroundColor: "#EC4899", transform: "translateZ(-10px)" }}
        />
      </motion.div>

      {/* Dynamic Shadow */}
      <motion.div
        style={{ 
          opacity: 0.15,
          scale: 0.8,
          rotateX: 90,
          transform: "translateY(160px) translateZ(-50px)",
        }}
        className="absolute inset-0 w-[240px] h-[40px] left-1/2 -translate-x-1/2 rounded-[100%] blur-2xl bg-black/40"
      />
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { user, homeLogoUrl, primaryColor, setGuestMode } = useApp();

  React.useEffect(() => {
    if (user?.isAuthenticated && !user?.isGuest) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  const handleGuest = () => { setGuestMode(); navigate("/feed"); };
  
  return (
    <div className="h-screen h-[100dvh] bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="relative z-10 text-center space-y-10 md:space-y-16 max-w-sm w-full flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col items-center gap-8 relative"
        >
          {/* Decorative Particles */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            {[...Array(6)].map((_, i) => (
              <Particle key={i} color={primaryColor} index={i} total={6} />
            ))}
          </div>
          
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
