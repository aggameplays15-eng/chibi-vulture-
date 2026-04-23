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
  const perspective = useMotionValue(2200);
  
  const springX = useSpring(rotateX, { stiffness: 45, damping: 35, mass: 1.2 });
  const springY = useSpring(rotateY, { stiffness: 45, damping: 35, mass: 1.2 });
  const springPersp = useSpring(perspective, { stiffness: 40, damping: 30 });
  
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 25, damping: 20 });
  
  const slices = 100; // Maximum precision
  const thickness = 50;

  React.useEffect(() => {
    let frame;
    let t = 0;
    
    const tick = () => {
      t += 0.004; // Plus lent et gracieux
      floatY.set(Math.sin(t) * 12);
      
      if (!isDragging.current) {
        // Friction plus douce pour un glissement plus long
        velocityX.current *= 0.97;
        velocityY.current *= 0.97;
        
        const baseSpin = 0.05; 
        rotateY.set(rotateY.get() + velocityX.current + baseSpin);
        
        // Retour à la position de repos plus organique
        const idleX = -12;
        const currentX = rotateX.get();
        rotateX.set(currentX + (idleX - currentX) * 0.015 + velocityY.current);
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
    // On garde une partie de la vélocité pour une transition fluide
    velocityX.current *= 0.5;
    velocityY.current *= 0.5;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    
    // Sensibilité accrue pour une sensation de légèreté
    const sensitivity = 0.35;
    rotateY.set(rotateY.get() + deltaX * sensitivity);
    rotateX.set(rotateX.get() - deltaY * sensitivity);
    
    velocityX.current = deltaX * sensitivity;
    velocityY.current = -deltaY * sensitivity;
    
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  // Directional Lighting Model - Calibré pour préserver les couleurs réelles
  const lighting = useTransform(springY, (y) => {
    const angle = (Number(y) % 360 + 360) % 360;
    const intensity = Math.abs(Math.cos((angle * Math.PI) / 180));
    const brightness = 0.9 + (intensity * 0.2); // Range 0.9 à 1.1 (100% de moyenne)
    return `brightness(${brightness})`;
  });

  return (
    <div 
      className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing" 
      style={{ perspective: springPersp, width: 440, height: 440 }} 
      onPointerDown={handlePointerDown} 
      onPointerMove={handlePointerMove} 
      onPointerUp={handlePointerUp} 
      onPointerLeave={handlePointerUp}
    >
      {/* Precision Ground Shadow */}
      <motion.div 
        className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none" 
        style={{ 
          width: 260, 
          height: 30, 
          background: "rgba(0,0,0,0.25)", 
          filter: "blur(20px)", 
          opacity: useTransform(floatSpring, [-10, 10], [0.6, 0.3]), 
          scaleX: useTransform(springX, [-30, 30], [1.1, 0.9]),
          rotateX: 85, 
          z: -500 
        }} 
      />

      <motion.div 
        style={{ rotateX: springX, rotateY: springY, y: floatSpring, transformStyle: "preserve-3d" }} 
        className="relative w-full h-full flex items-center justify-center select-none"
      >
        {Array.from({ length: slices }).map((_, i) => {
          const zPos = (i - slices / 2) * (thickness / slices);
          // Precise geometric bevel
          const bevelScale = 0.9 + Math.sin((i / (slices - 1)) * Math.PI) * 0.1;
          
          const isFace = i === 0 || i === slices - 1;
          const isBack = i === 0;

          // Hard Ambient Occlusion for depth definition
          const ao = 0.8 + (Math.sin((i / (slices - 1)) * Math.PI) * 0.2);
          const edgeBrightness = (0.5 + (Math.sin((i / slices) * Math.PI) * 0.5)) * ao;
          
          // Rendu des couleurs originales : Pas de sur-contraste sur la face principale
          return (
            <motion.img 
              key={i} 
              src={logoUrl} 
              alt="" 
              draggable={false} 
              style={{ 
                position: "absolute", 
                width: 310, 
                height: 310, 
                objectFit: "contain", 
                transform: `translateZ(${zPos}px) scale(${bevelScale}) ${isBack ? "rotateY(180deg)" : ""}`, 
                filter: isFace 
                  ? lighting // Utilise le transform calculé (0.85 à 1.1) pour un rendu naturel
                  : `brightness(${edgeBrightness}) contrast(1.2) blur(${Math.abs(zPos) * 0.02}px)`, 
                pointerEvents: "none", 
                backfaceVisibility: isFace ? "hidden" : "visible", 
                willChange: "transform",
                imageRendering: isFace ? "auto" : "pixelated"
              }} 
            />
          );
        })}
      </motion.div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { homeLogoUrl, primaryColor, setGuestMode } = useApp();
  const handleGuest = () => { setGuestMode(); navigate("/feed"); };
  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="relative z-10 text-center space-y-10 max-w-sm w-full">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            <BookLogo logoUrl={homeLogoUrl} primaryColor={primaryColor} />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">CHIBI<br /><span className="gradient-text" style={{ backgroundImage: "linear-gradient(135deg, " + primaryColor + ", #8B5CF6, #3B82F6)" }}>VULTURE</span></h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold tracking-wide">La communaute des artistes</p>
          </div>
        </motion.div>
        <div className="flex justify-center gap-2 flex-wrap">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
              <Icon size={11} style={{ color: primaryColor }} />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Link to="/login"><Button className="w-full h-16 rounded-[28px] text-white text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex gap-3" style={{ backgroundColor: primaryColor, boxShadow: "0 20px 50px " + primaryColor + "45" }}>SE CONNECTER <ArrowRight size={22} /></Button></Link>
          <Link to="/signup"><Button variant="outline" className="w-full h-14 rounded-[28px] text-gray-700 dark:text-gray-300 text-base font-bold border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex gap-2 mt-3"><UserPlus size={18} />CREER UN COMPTE</Button></Link>
          <Button variant="ghost" onClick={handleGuest} className="w-full h-12 rounded-[28px] text-gray-400 dark:text-gray-600 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex gap-2"><Eye size={16} />Explorer en invite</Button>
        </div>
        <div className="pt-2"><Link to="/goated" className="text-[9px] text-gray-200 dark:text-gray-800 hover:text-gray-400 font-black uppercase tracking-[0.4em] transition-colors">Admin Panel</Link></div>
      </div>
    </div>
  );
};

export default Index;
