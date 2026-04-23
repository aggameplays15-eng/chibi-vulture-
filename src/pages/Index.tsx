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
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
  
  const rotateX = useMotionValue(-12);
  const rotateY = useMotionValue(0);
  const perspective = useMotionValue(2500);
  
  const springX = useSpring(rotateX, { stiffness: 60, damping: 35 });
  const springY = useSpring(rotateY, { stiffness: 60, damping: 35 });
  const springPersp = useSpring(perspective, { stiffness: 40, damping: 30 });
  
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 20, damping: 25 });
  
  const slices = 80; 
  const thickness = 60;

  React.useEffect(() => {
    let frame;
    let t = 0;
    
    const tick = () => {
      t += 0.003;
      floatY.set(Math.sin(t) * 12);
      
      if (!isDragging.current) {
        velocityX.current *= 0.95;
        velocityY.current *= 0.95;
        const baseSpin = 0.05; 
        rotateY.set(rotateY.get() + velocityX.current + baseSpin);
        const idleX = -12;
        const currentX = rotateX.get();
        rotateX.set(currentX + (idleX - currentX) * 0.04 + velocityY.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    const sensitivity = 0.4;
    rotateY.set(rotateY.get() + deltaX * sensitivity);
    rotateX.set(rotateX.get() - deltaY * sensitivity);
    velocityX.current = deltaX * sensitivity;
    velocityY.current = -deltaY * sensitivity;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  const lighting = useTransform(springY, (y) => {
    const angle = (Number(y) % 360 + 360) % 360;
    const intensity = Math.abs(Math.cos((angle * Math.PI) / 180));
    return `brightness(${0.9 + (intensity * 0.25)})`;
  });

  const glareX = useTransform(springY, (y) => ((Number(y) % 360) / 360) * 200 - 100);

  return (
    <div 
      className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing" 
      style={{ perspective: springPersp, width: 450, height: 450 }} 
      onPointerDown={handlePointerDown} 
      onPointerMove={handlePointerMove} 
      onPointerUp={handlePointerUp} 
      onPointerLeave={handlePointerUp}
    >
      <motion.div 
        className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none" 
        style={{ 
          width: 280, height: 40, 
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%)", 
          filter: "blur(25px)", 
          opacity: useTransform(floatSpring, [-12, 12], [0.4, 0.2]), 
          scale: useTransform(springX, [-30, 30], [1.2, 0.8]),
          z: -1000 
        }} 
      />

      <motion.div 
        style={{ rotateX: springX, rotateY: springY, y: floatSpring, transformStyle: "preserve-3d" }} 
        className="relative w-full h-full flex items-center justify-center select-none"
      >
        {Array.from({ length: slices }).map((_, i) => {
          const zPos = (i - slices / 2) * (thickness / slices);
          const isFace = i === 0 || i === slices - 1;
          const isFront = i === slices - 1;
          const isBack = i === 0;
          const ao = 0.7 + (Math.sin((i / (slices - 1)) * Math.PI) * 0.3);
          const edgeBrightness = isFace ? 1 : 0.4 + (Math.sin((i / slices) * Math.PI) * 0.6) * ao;
          
          return (
            <motion.div key={i} style={{ position: "absolute", width: 320, height: 320, transform: `translateZ(${zPos}px)`, transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}>
              <motion.img 
                src={logoUrl} alt="" draggable={false} 
                style={{ 
                  width: "100%", height: "100%", objectFit: "contain", 
                  filter: isFace ? lighting : `brightness(${edgeBrightness})`,
                  opacity: isFace ? 1 : 0.85,
                  transform: isBack ? "rotateY(180deg)" : "none",
                }} 
              />
              {isFront && (
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)`,
                    backgroundSize: '200% 200%', x: glareX, mixBlendMode: 'overlay',
                    WebkitMaskImage: `url(${logoUrl})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
                  }}
                />
              )}
              {!isFace && (
                <div className="absolute inset-0 border-[3px] rounded-full opacity-10" style={{ borderColor: primaryColor, filter: 'blur(1px)' }} />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { user, homeLogoUrl, primaryColor, setGuestMode } = useApp();

  // Redirection automatique si déjà connecté
  React.useEffect(() => {
    if (user?.isAuthenticated && !user?.isGuest) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  const handleGuest = () => { setGuestMode(); navigate("/feed"); };
  
  return (
    <div className="h-screen h-[100dvh] bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="relative z-10 text-center space-y-6 md:space-y-10 max-w-sm w-full flex flex-col items-center">
        
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} 
          className="flex flex-col items-center gap-4 md:gap-8"
        >
          <div className="relative flex items-center justify-center scale-[0.75] md:scale-100">
            <BookLogo logoUrl={homeLogoUrl} primaryColor={primaryColor} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">
              CHIBI<br />
              <span className="gradient-text" style={{ backgroundImage: "linear-gradient(135deg, " + primaryColor + ", #8B5CF6, #3B82F6)" }}>
                VULTURE
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 font-semibold tracking-wide">La communaute des artistes</p>
          </div>
        </motion.div>

        {/* Features Chips */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
              <Icon size={10} style={{ color: primaryColor }} />
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Buttons Section */}
        <div className="space-y-3 w-full">
          <Link to="/login" className="block">
            <Button 
              className="w-full h-14 md:h-16 rounded-[28px] text-white text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex gap-3" 
              style={{ backgroundColor: primaryColor, boxShadow: "0 20px 50px " + primaryColor + "45" }}
            >
              SE CONNECTER <ArrowRight size={22} />
            </Button>
          </Link>
          
          <Link to="/signup" className="block">
            <Button 
              variant="outline" 
              className="w-full h-12 md:h-14 rounded-[28px] text-gray-700 dark:text-gray-300 text-base font-bold border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex gap-2"
            >
              <UserPlus size={18} />CREER UN COMPTE
            </Button>
          </Link>

          {/* Bouton Invité Premium - Uniquement si non connecté */}
          {!user?.isAuthenticated && (
            <div className="relative group pt-2">
              <div 
                className="absolute -inset-0.5 rounded-[28px] blur opacity-10 group-hover:opacity-30 transition duration-1000"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <Button 
                variant="ghost" 
                onClick={handleGuest} 
                className="relative w-full h-12 rounded-[28px] bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-black hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex gap-3 shadow-sm"
              >
                <Eye size={18} style={{ color: primaryColor }} />
                EXPLORER SANS COMPTE
              </Button>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link to="/goated" className="text-[9px] text-gray-200 dark:text-gray-800 hover:text-gray-400 font-black uppercase tracking-[0.4em] transition-colors">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
