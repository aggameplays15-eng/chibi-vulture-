"use client";

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const Index = () => {
  const navigate = useNavigate();
  const { setGuestMode, homeLogoUrl, primaryColor } = useApp();
  const [isInteracting, setIsInteracting] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Ressorts ultra-réactifs pour le mouvement et le retour
  const springX = useSpring(rotateX, { damping: 25, stiffness: 350 });
  const springY = useSpring(rotateY, { damping: 25, stiffness: 350 });

  // Auto-rotation fluide (uniquement quand on ne touche pas au logo)
  useEffect(() => {
    if (isInteracting) return;

    const controls = animate(rotateY, rotateY.get() + 360, {
      duration: 15,
      repeat: Infinity,
      ease: "linear"
    });
    
    return () => controls.stop();
  }, [rotateY, isInteracting]);

  const handlePanStart = () => {
    setIsInteracting(true);
  };

  const handlePan = (_: unknown, info: { delta: { x: number; y: number } }) => {
    rotateY.set(rotateY.get() + info.delta.x * 1.5);
    rotateX.set(rotateX.get() - info.delta.y * 1.5);
  };

  const handlePanEnd = () => {
    // Animation de retour au centre
    animate(rotateX, 0, { type: "spring", damping: 20, stiffness: 200 });
    animate(rotateY, 0, { 
      type: "spring", 
      damping: 20, 
      stiffness: 200,
      onComplete: () => setIsInteracting(false) 
    });
  };

  const handleGuestAccess = () => {
    setGuestMode();
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ backgroundColor: `${primaryColor}20` }}
        />
      </div>

      <div className="relative z-10 text-center space-y-12 max-w-sm w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="relative inline-block perspective-[2000px]">
            {/* Anneau décoratif */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-12 border-2 border-dashed rounded-full opacity-5 pointer-events-none"
              style={{ borderColor: primaryColor }}
            />
            
            {/* LOGO INTERACTIF */}
            <motion.div
              onPanStart={handlePanStart}
              onPan={handlePan}
              onPanEnd={handlePanEnd}
              style={{ 
                rotateX: springX, 
                rotateY: springY, 
                transformStyle: "preserve-3d" 
              }}
              whileTap={{ scale: 1.1 }}
              className="w-56 h-56 sm:w-64 sm:h-64 mx-auto relative cursor-grab active:cursor-grabbing"
            >
              {/* Face Avant */}
              <div 
                className="absolute inset-0 bg-white rounded-[70px] shadow-[0_30px_80px_rgba(0,0,0,0.1)] flex items-center justify-center border border-gray-50"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(1px)',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={homeLogoUrl} 
                  alt="Chibi Vulture Logo"
                  width={176}
                  height={176}
                  className="w-44 h-44 object-contain drop-shadow-xl" 
                />
              </div>

              {/* Face Arrière */}
              <div 
                className="absolute inset-0 bg-white rounded-[70px] flex items-center justify-center border border-gray-100"
                style={{ 
                  transform: 'rotateY(180deg) translateZ(1px)', 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <img 
                  src={homeLogoUrl} 
                  alt=""
                  width={176}
                  height={176}
                  className="w-44 h-44 object-contain opacity-40" 
                />
              </div>
            </motion.div>
          </div>

          <div className="space-y-3 pt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase">Premium Art Community</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              CHIBI<br/>
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, #8B5CF6)` }}>
                VULTURE
              </span>
            </h1>
          </div>
        </motion.div>

        <div className="space-y-4">
          <Link to="/login" data-testid="login-button">
            <Button 
              className="w-full h-16 rounded-[28px] text-white text-xl font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex gap-3"
              style={{ backgroundColor: primaryColor, boxShadow: `0 20px 40px ${primaryColor}40` }}
            >
              SE CONNECTER
              <ArrowRight size={24} />
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            onClick={handleGuestAccess}
            data-testid="guest-button"
            className="w-full h-16 rounded-[28px] text-gray-500 text-lg font-bold hover:bg-gray-50 transition-all flex gap-2"
          >
            <Eye size={20} />
            Explorer en invité
          </Button>
        </div>

        <div className="pt-4">
          <Link to="/admin" className="text-[9px] text-gray-300 hover:text-gray-500 font-black uppercase tracking-[0.4em] transition-colors">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
