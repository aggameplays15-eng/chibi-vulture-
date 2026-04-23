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
const BookLogo = ({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);

  // Rotation values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  // Springs for smoothness
  const springX = useSpring(rotateX, { stiffness: 60, damping: 25, mass: 0.5 });
  const springY = useSpring(rotateY, { stiffness: 60, damping: 25, mass: 0.5 });

  // Idle float
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 60, damping: 12 });

  React.useEffect(() => {
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.015;
      floatY.set(Math.sin(t) * 12);

      if (!isDragging.current) {
        // Apply friction to velocity
        velocityX.current *= 0.95;
        velocityY.current *= 0.95;

        // Base auto-rotation (becomes dominant when velocity is low)
        const autoRotate = 0.2;
        rotateY.set(rotateY.get() + velocityX.current + autoRotate);
        rotateX.set(rotateX.get() + velocityY.current);
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
    
    const sensitivity = 0.5;
    rotateY.set(rotateY.get() + deltaX * sensitivity);
    rotateX.set(rotateX.get() - deltaY * sensitivity);
    
    // Store velocity for inertia
    velocityX.current = deltaX * sensitivity;
    velocityY.current = -deltaY * sensitivity;
    
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      style={{ perspective: '1500px', width: 300, height: 300 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Dynamic floor shadow */}
      <motion.div
        className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 180,
          height: 34,
          background: `radial-gradient(ellipse, ${primaryColor}40 0%, transparent 75%)`,
          filter: 'blur(18px)',
          opacity: useTransform(floatSpring, [-12, 12], [0.5, 0.2]),
          scale: useTransform(floatSpring, [-12, 12], [0.85, 1.15]),
        }}
      />

      {/* Floating 3D Logo Container */}
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          y: floatSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center select-none"
      >
        {/* Central Glow / Core */}
        <div 
          className="absolute inset-0 blur-[50px] opacity-25 pointer-events-none"
          style={{ backgroundColor: primaryColor, transform: 'translateZ(0px)' }}
        />
        
        {/* FRONT FACE */}
        <img
          src={logoUrl}
          alt="Chibi Vulture Front"
          draggable={false}
          style={{
            width: 230,
            height: 230,
            objectFit: 'contain',
            filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.3))`,
            transform: 'translateZ(2px)', // Front offset
            backfaceVisibility: 'hidden',
          }}
        />

        {/* BACK FACE (Reversed and slightly darker) */}
        <img
          src={logoUrl}
          alt="Chibi Vulture Back"
          draggable={false}
          style={{
            width: 230,
            height: 230,
            objectFit: 'contain',
            filter: `brightness(0.6) grayscale(0.2) drop-shadow(0 20px 40px rgba(0,0,0,0.3))`,
            transform: 'translateZ(-2px) rotateY(180deg)', // Back offset + Flip
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Dynamic Highlight (Shimmer) */}
        <motion.div 
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background: `linear-gradient(135deg, transparent 30%, white 50%, transparent 70%)`,
            opacity: 0.15,
            transform: 'translateZ(30px)',
            mixBlendMode: 'overlay',
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
