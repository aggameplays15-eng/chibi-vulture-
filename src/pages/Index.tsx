"use client";

import React, { useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Eye, Zap, ShoppingBag, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const FEATURES = [
  { icon: Zap, label: "Feed en temps réel" },
  { icon: ShoppingBag, label: "Boutique intégrée" },
  { icon: Users, label: "Communauté" },
];

// ─── 3D Floating Logo ────────────────────────────────────────────────────────
// ─── 360 Libre Floating Logo ────────────────────────────────────────────────────────
// ─── 360 Libre Floating Logo ────────────────────────────────────────────────────────
// ─── High-Fidelity 360 Extruded Logo ──────────────────────────────────────────
const BookLogo = ({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
 
  // Base rotation
  const rotateX = useMotionValue(-10);
  const rotateY = useMotionValue(0);
 
  // Springs for heavy, premium physics
  const springX = useSpring(rotateX, { stiffness: 40, damping: 20, mass: 1 });
  const springY = useSpring(rotateY, { stiffness: 40, damping: 20, mass: 1 });
 
  // Floating animation
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 30, damping: 15 });
 
  // Slices count for extrusion (thickness)
  const slices = 15;
  const thickness = 18; // total depth in pixels
 
  React.useEffect(() => {
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.012;
      floatY.set(Math.sin(t) * 15);
 
      if (!isDragging.current) {
        // High-friction inertia
        velocityX.current *= 0.96;
        velocityY.current *= 0.96;
 
        // Constant elegant auto-rotation
        const autoY = 0.15 + (Math.sin(t * 0.5) * 0.05);
        rotateY.set(rotateY.get() + velocityX.current + autoY);
        
        // Auto-center X rotation with a bit of sway
        const targetX = -10 + (Math.cos(t * 0.7) * 5);
        rotateX.set(rotateX.get() + (targetX - rotateX.get()) * 0.02 + velocityY.current);
      }
 
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [floatY, rotateY, rotateX]);
 
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    velocityX.current = 0;
    velocityY.current = 0;
  };
 
  const handlePointerUp = () => {
    isDragging.current = false;
  };
 
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    
    const sensitivity = 0.6;
    rotateY.set(rotateY.get() + deltaX * sensitivity);
    rotateX.set(rotateX.get() - deltaY * sensitivity);
    
    velocityX.current = deltaX * sensitivity;
    velocityY.current = -deltaY * sensitivity;
    
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  // Lighting Math based on rotation
  const shimmerOpacity = useTransform(springY, (y) => {
    const angle = (y % 360 + 360) % 360;
    // Shine when facing roughly front (0, 360) or back (180)
    const factor = Math.abs(Math.cos((angle * Math.PI) / 180));
    return factor * 0.4;
  });

  const glossTranslateX = useTransform(springY, [-180, 180], [100, -100], { clamp: false });
 
  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      style={{ perspective: '2000px', width: 320, height: 320 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dynamic floor shadow - Reactive to rotation */}
      <motion.div
        className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 40,
          background: `radial-gradient(ellipse, ${primaryColor}50 0%, transparent 80%)`,
          filter: 'blur(25px)',
          opacity: useTransform(floatSpring, [-15, 15], [0.6, 0.2]),
          scale: useTransform(floatSpring, [-15, 15], [0.9, 1.2]),
          rotateX: 80,
          z: -100
        }}
      />
 
      {/* 3D Extruded Container */}
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          y: floatSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center select-none"
      >
        {/* Core Volumetric Glow */}
        <motion.div 
          className="absolute inset-0 blur-[60px] pointer-events-none rounded-full"
          style={{ 
            backgroundColor: primaryColor, 
            transform: 'translateZ(0px)',
            opacity: useTransform(floatSpring, [-15, 15], [0.15, 0.3])
          }}
        />

        {/* EXTRUSION LAYERS (The "Magic" Math) */}
        {Array.from({ length: slices }).map((_, i) => {
          const zOffset = (i - slices / 2) * (thickness / slices);
          const isOuter = i === 0 || i === slices - 1;
          const brightness = isOuter ? 1 : 0.7 + (Math.sin((i / slices) * Math.PI) * 0.3);
          
          return (
            <img
              key={i}
              src={logoUrl}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                objectFit: 'contain',
                // Stack layers on Z axis
                transform: `translateZ(${zOffset}px) ${i === slices - 1 ? 'rotateY(180deg)' : ''}`,
                // Darken inner layers for edge occlusion/depth
                filter: `brightness(${brightness}) ${!isOuter ? 'blur(0.5px)' : ''} drop-shadow(0 ${isOuter ? 10 : 0}px 20px rgba(0,0,0,0.2))`,
                pointerEvents: 'none',
                // Flip back face
                backfaceVisibility: isOuter ? 'hidden' : 'visible',
              }}
            />
          );
        })}

        {/* Dynamic Light Glint (The Algorithmic Shimmer) */}
        <motion.div 
          className="absolute w-[300px] h-[300px] pointer-events-none overflow-hidden"
          style={{ transform: 'translateZ(10px)' }}
        >
          <motion.div
            className="w-full h-full"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)`,
              opacity: shimmerOpacity,
              x: glossTranslateX,
              mixBlendMode: 'overlay',
            }}
          />
        </motion.div>

        {/* Side Edge Filling (Fake Mesh) */}
        <div 
          className="absolute w-[240px] h-[240px] opacity-20 pointer-events-none"
          style={{
            border: `10px solid ${primaryColor}`,
            borderRadius: '50%',
            filter: 'blur(30px)',
            transform: 'translateZ(0px)',
          }}
        />
      </motion.div>
    </div>
  );
};



const Index = () => {
  const navigate = useNavigate();
  const { homeLogoUrl, primaryColor, setGuestMode } = useApp();

  const handleGuest = () => {
    setGuestMode();
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ backgroundColor: `${primaryColor}30` }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, delay: 3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ backgroundColor: `#8B5CF630` }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, delay: 6 }}
          className="absolute top-[40%] right-[-5%] w-[300px] h-[300px] rounded-full blur-[80px] bg-blue-200 dark:bg-blue-900"
        />
      </div>

      <div className="relative z-10 text-center space-y-10 max-w-sm w-full">

        {/* ── Logo 3D ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center gap-8"
        >
          {/* Orbit rings */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border border-dashed opacity-[0.08] pointer-events-none"
              style={{ width: 290, height: 290, borderColor: primaryColor }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border border-dashed opacity-[0.05] pointer-events-none"
              style={{ width: 250, height: 250, borderColor: '#8B5CF6' }}
            />

            <BookLogo logoUrl={homeLogoUrl} primaryColor={primaryColor} />
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <h1 className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9]">
              CHIBI<br />
              <span
                className="gradient-text"
                style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, #8B5CF6, #3B82F6)` }}
              >
                VULTURE
              </span>
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
              La communauté des artistes
            </p>
          </motion.div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="flex justify-center gap-2 flex-wrap"
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8"
            >
              <Icon size={11} style={{ color: primaryColor }} />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="space-y-3"
        >
          <Link to="/login" data-testid="login-button">
            <Button
              className="w-full h-16 rounded-[28px] text-white text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex gap-3"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 20px 50px ${primaryColor}45`,
              }}
            >
              SE CONNECTER
              <ArrowRight size={22} />
            </Button>
          </Link>

          <Link to="/signup">
            <Button
              variant="outline"
              className="w-full h-14 rounded-[28px] text-gray-700 dark:text-gray-300 text-base font-bold border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex gap-2 mt-3"
            >
              <UserPlus size={18} />
              CRÉER UN COMPTE
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleGuest}
            data-testid="guest-button"
            className="w-full h-12 rounded-[28px] text-gray-400 dark:text-gray-600 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex gap-2"
          >
            <Eye size={16} />
            Explorer en invité
          </Button>
        </motion.div>

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
