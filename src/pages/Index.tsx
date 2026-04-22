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
const BookLogo = ({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [28, -28]), {
    stiffness: 180, damping: 22, mass: 0.6,
  });
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [-22, 22]), {
    stiffness: 180, damping: 22, mass: 0.6,
  });

  // Idle float
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 60, damping: 12 });

  React.useEffect(() => {
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.018;
      floatY.set(Math.sin(t) * 10);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [floatY]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0); mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !touch) return;
    mouseX.set((touch.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((touch.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

  const handleTouchEnd = useCallback(() => {
    mouseX.set(0); mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ perspective: '900px', width: 220, height: 220 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ombre au sol dynamique */}
      <motion.div
        className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 130,
          height: 24,
          background: `radial-gradient(ellipse, ${primaryColor}50 0%, transparent 70%)`,
          filter: 'blur(14px)',
          scaleX: useTransform(mouseX, [-0.5, 0.5], [0.75, 1.25]),
          opacity: useTransform(mouseY, [-0.5, 0.5], [0.85, 0.35]),
        }}
      />

      {/* Logo flottant */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          y: floatSpring,
          transformStyle: 'preserve-3d',
        }}
        className="cursor-grab active:cursor-grabbing select-none"
      >
        <img
          src={logoUrl}
          alt="Chibi Vulture"
          draggable={false}
          style={{
            width: 190,
            height: 190,
            objectFit: 'contain',
            filter: `drop-shadow(0 24px 40px ${primaryColor}55) drop-shadow(0 8px 16px rgba(0,0,0,0.15))`,
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
