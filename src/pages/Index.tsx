"use client";

import React, { useRef } from 'react';
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

const BookLogo = ({ logoUrl, primaryColor }) => {
  return (
    <div className="relative group cursor-pointer">
      {/* Halo lumineux dynamique */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-40px] rounded-full blur-[60px]"
        style={{ 
          background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)` 
        }}
      />
      
      {/* Rotation 360 Fluide */}
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        className="relative z-10"
      >
        <motion.img 
          src={logoUrl} 
          alt="Logo"
          className="w-[280px] md:w-[320px] h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
          style={{ backfaceVisibility: "visible" }}
        />
        
        {/* Reflet de balayage (Shimmer) */}
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none"
        />
      </motion.div>

      {/* Ombre portée douce */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[180px] h-[20px] rounded-full blur-xl"
        style={{ background: 'rgba(0,0,0,0.1)' }}
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
    <div className="h-screen h-[100dvh] bg-[#FAFAFA] dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Fond décoratif premium */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: primaryColor }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: '#8B5CF6' }} />

      <div className="relative z-10 text-center space-y-8 md:space-y-12 max-w-sm w-full flex flex-col items-center">
        
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} 
          className="flex flex-col items-center gap-6"
        >
          <div className="scale-[0.85] md:scale-100">
            <BookLogo logoUrl={homeLogoUrl} primaryColor={primaryColor} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.85]">
              CHIBI<br />
              <span className="gradient-text animate-gradient-x" style={{ 
                backgroundImage: `linear-gradient(90deg, ${primaryColor}, #8B5CF6, ${primaryColor})`,
                backgroundSize: '200% auto'
              }}>
                VULTURE
              </span>
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.3em]">
              L'excellence artistique
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-4 w-full">
          <Link to="/login" className="block">
            <Button 
              className="w-full h-16 rounded-[32px] text-white text-lg font-black shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex gap-3 group" 
              style={{ 
                backgroundColor: primaryColor,
                boxShadow: `0 20px 40px ${primaryColor}30`
              }}
            >
              SE CONNECTER 
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/signup">
              <Button 
                variant="outline" 
                className="w-full h-14 rounded-3xl text-gray-700 dark:text-gray-300 text-xs font-black border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                INSCRIPTION
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              onClick={handleGuest} 
              className="w-full h-14 rounded-3xl bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex gap-2 border border-transparent"
            >
              INVITÉ <Eye size={14} style={{ color: primaryColor }} />
            </Button>
          </div>
        </div>

        {/* Decorative footer features */}
        <div className="flex justify-center gap-4 opacity-40">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={12} className="text-gray-400" />
              <span className="text-[7px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

      </div>
    </div>
  );
};

export default Index;
