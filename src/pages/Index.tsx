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
// ─── 360 Libre Floating Logo ──────�// ─── Orbital Particle Component ─────────────────────────────────────────────
const Particle = ({ color, index, total }: { color: string, index: number, total: number }) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = 180 + Math.random() * 40;
  const duration = 15 + Math.random() * 10;
  
  return (
    <motion.div
      animate={{
        rotate: [0, 360],
        y: [0, -20, 0],
      }}
      transition={{
        rotate: { duration, repeat: Infinity, ease: "linear" },
        y: { duration: duration / 2, repeat: Infinity, ease: "easeInOut" }
      }}
      className="absolute pointer-events-none"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full blur-[1px]" 
        style={{ 
          backgroundColor: color, 
          boxShadow: `0 0 10px ${color}`,
          transform: `translate(${radius}px, 0)` 
        }} 
      />
    </motion.div>
  );
};

// ─── High-Fidelity 360 Extruded Logo ──────────────────────────────────────────
const BookLogo = ({ logoUrl, primaryColor }: { logoUrl: string; primaryColor: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const velocityX = useRef(0);
  const velocityY = useRef(0);
 
  // Base rotation & Physics
  const rotateX = useMotionValue(-12);
  const rotateY = useMotionValue(0);
  const velocity = useMotionValue(0);
  const perspective = useMotionValue(2000);
 
  // Springs for heavy, liquid-metal physics
  const springX = useSpring(rotateX, { stiffness: 35, damping: 20, mass: 1.5 });
  const springY = useSpring(rotateY, { stiffness: 35, damping: 20, mass: 1.5 });
  const springPersp = useSpring(perspective, { stiffness: 50, damping: 30 });
 
  // Floating animation
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 30, damping: 15 });
 
  // Rendering Constants
  const slices = 22; // Ultra-high density
  const thickness = 26; // Deep extrusion
 
  React.useEffect(() => {
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.01;
      floatY.set(Math.sin(t) * 18);
 
      if (!isDragging.current) {
        velocityX.current *= 0.98; // Lower friction for longer spins
        velocityY.current *= 0.98;
 
        const autoY = 0.22 + (Math.sin(t * 0.3) * 0.1);
        rotateY.set(rotateY.get() + velocityX.current + autoY);
        
        const targetX = -12 + (Math.cos(t * 0.5) * 8);
        rotateX.set(rotateX.get() + (targetX - rotateX.get()) * 0.02 + velocityY.current);
      }

      // Dynamic FOV based on speed (Perspective warp)
      const speed = Math.abs(velocityX.current) + Math.abs(velocityY.current);
      velocity.set(speed);
      perspective.set(2000 - (speed * 40));
 
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
    
    velocityX.current = deltaX * sensitivity;
    velocityY.current = -deltaY * sensitivity;
    
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };

  // Advanced Rendering Math
  const shimmerOpacity = useTransform(springY, (y) => {
    const angle = (y % 360 + 360) % 360;
    const factor = Math.pow(Math.abs(Math.cos((angle * Math.PI) / 180)), 2); // Sharp glint
    return factor * 0.6;
  });

  const envX = useTransform(springY, [-180, 180], [200, -200], { clamp: false });
  const glowScale = useTransform(velocity, [0, 15], [1, 1.6]);
  const glowOpacity = useTransform(velocity, [0, 15], [0.2, 0.6]);
 
  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      style={{ 
        perspective: springPersp as any, 
        width: 360, 
        height: 360 
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Orbital Particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Particle key={i} index={i} total={8} color={i % 2 === 0 ? primaryColor : '#8B5CF6'} />
      ))}

      {/* Volumetric shadow */}
      <motion.div
        className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 240,
          height: 50,
          background: `radial-gradient(ellipse, ${primaryColor}70 0%, transparent 90%)`,
          filter: 'blur(35px)',
          opacity: useTransform(floatSpring, [-18, 18], [0.8, 0.2]),
          scale: useTransform(floatSpring, [-18, 18], [0.8, 1.3]),
          rotateX: 85,
          z: -200
        }}
      />
 
      {/* MASTER 3D SCENE */}
      <motion.div
        style={{
          rotateX: springX,
          rotateY: springY,
          y: floatSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full flex items-center justify-center select-none"
      >
        {/* Environmental Glow */}
        <motion.div 
          className="absolute inset-0 blur-[80px] pointer-events-none rounded-full"
          style={{ 
            backgroundColor: primaryColor, 
            transform: 'translateZ(-10px)',
            scale: glowScale,
            opacity: glowOpacity
          }}
        />

        {/* ULTRA-HD EXTRUSION STACK */}
        {Array.from({ length: slices }).map((_, i) => {
          const zPos = (i - slices / 2) * (thickness / slices);
          const isFront = i === slices - 1;
          const isBack = i === 0;
          
          // Depth of Field Calculation (Math.abs(zPos) = distance from center)
          const dofBlur = Math.abs(zPos) * 0.15;
          // Shading: Middle layers get darker to simulate ambient occlusion
          const ambientOcclusion = 0.75 + (Math.sin((i / slices) * Math.PI) * 0.25);
          
          return (
            <img
              key={i}
              src={logoUrl}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                width: 260,
                height: 260,
                objectFit: 'contain',
                transform: `translateZ(${zPos}px) ${isBack ? 'rotateY(180deg)' : ''}`,
                filter: `brightness(${ambientOcclusion}) blur(${dofBlur}px) 
                         ${(isFront || isBack) ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))' : ''}`,
                pointerEvents: 'none',
                backfaceVisibility: (isFront || isBack) ? 'hidden' : 'visible',
                // Chrome optimization
                willChange: 'transform',
              }}
            />
          );
        })}

        {/* Dynamic Reflection Layer (HDRi simulation) */}
        <motion.div 
          className="absolute w-[300px] h-[300px] pointer-events-none overflow-hidden rounded-full"
          style={{ transform: 'translateZ(15px)', mixBlendMode: 'soft-light' }}
        >
          <motion.div
            className="w-full h-full"
            style={{
              background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%)`,
              opacity: shimmerOpacity,
              x: envX,
              y: useTransform(springX, [-45, 45], [-50, 50]),
              scale: 2,
              filter: 'blur(10px)',
            }}
          />
        </motion.div>

        {/* Surface Highlight (Edge Light) */}
        <motion.div 
          className="absolute w-[265px] h-[265px] pointer-events-none rounded-full"
          style={{ 
            border: `1px solid white`,
            opacity: useTransform(shimmerOpacity, [0, 0.6], [0.05, 0.3]),
            transform: 'translateZ(14px)',
            filter: 'blur(2px)'
          }}
        />

        {/* Atmosphere / Halo */}
        <motion.div 
          className="absolute rounded-full pointer-events-none"
          style={{ 
            width: 300, 
            height: 300, 
            border: `2px solid ${primaryColor}20`,
            transform: 'translateZ(-15px)',
            scale: useTransform(velocity, [0, 20], [1, 1.25]),
            opacity: useTransform(velocity, [0, 20], [0.1, 0.4])
          }}
        />
      </motion.div>
    </div>
  );
};
immerOpacity,
              x: glossTranslateX,
              mixBlendMode: 'overlay',
            }}
          />
        </motion.div>

        {/* Ambient Ring */}
        <motion.div 
          className="absolute rounded-full border-2 border-white/5 opacity-10 pointer-events-none"
          style={{ 
            width: 280, 
            height: 280, 
            transform: 'translateZ(-5px)',
            scale: useTransform(velocity, [0, 10], [1, 1.1])
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
