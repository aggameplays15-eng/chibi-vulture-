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
  const velocity = useMotionValue(0);
  const perspective = useMotionValue(2000);
  const scanPos = useMotionValue(-100);
  const springX = useSpring(rotateX, { stiffness: 30, damping: 18, mass: 1.8 });
  const springY = useSpring(rotateY, { stiffness: 30, damping: 18, mass: 1.8 });
  const springPersp = useSpring(perspective, { stiffness: 40, damping: 25 });
  const springScan = useSpring(scanPos, { stiffness: 20, damping: 15 });
  const floatY = useMotionValue(0);
  const floatSpring = useSpring(floatY, { stiffness: 25, damping: 12 });
  const slices = 26;
  const thickness = 30;
  React.useEffect(() => {
    let frame;
    let t = 0;
    setTimeout(() => scanPos.set(100), 500);
    const tick = () => {
      t += 0.008;
      floatY.set(Math.sin(t) * 20);
      if (!isDragging.current) {
        velocityX.current *= 0.985;
        velocityY.current *= 0.985;
        rotateY.set(rotateY.get() + velocityX.current + 0.25 + (Math.sin(t * 0.25) * 0.12));
        const targetX = -12 + (Math.cos(t * 0.45) * 10);
        rotateX.set(rotateX.get() + (targetX - rotateX.get()) * 0.02 + velocityY.current);
      }
      const speed = Math.abs(velocityX.current) + Math.abs(velocityY.current);
      velocity.set(speed);
      perspective.set(2200 - (speed * 50));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const handlePointerDown = (e) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    velocityX.current = 0;
    velocityY.current = 0;
  };
  const handlePointerUp = () => { isDragging.current = false; };
  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastX.current;
    const deltaY = e.clientY - lastY.current;
    rotateY.set(rotateY.get() + deltaX * 0.45);
    rotateX.set(rotateX.get() - deltaY * 0.45);
    velocityX.current = deltaX * 0.45;
    velocityY.current = -deltaY * 0.45;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
  };
  const shimmerOpacity = useTransform(springY, (y) => {
    const angle = (Number(y) % 360 + 360) % 360;
    return Math.pow(Math.abs(Math.cos((angle * Math.PI) / 180)), 3) * 0.7;
  });
  const envX = useTransform(springY, [-180, 180], [250, -250], { clamp: false });
  const glowScale = useTransform(velocity, [0, 20], [1, 1.8]);
  const glowOpacity = useTransform(velocity, [0, 20], [0.15, 0.55]);
  const scanY = useTransform(springScan, [-100, 100], ["-150%", "150%"]);
  return (
    <div className="relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing" style={{ perspective: springPersp, width: 380, height: 380 }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {Array.from({ length: 12 }).map((_, i) => <Particle key={i} index={i} total={12} color={i % 3 === 0 ? primaryColor : i % 3 === 1 ? "#8B5CF6" : "#3B82F6"} />)}
      <motion.div className="absolute bottom-[-70px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none" style={{ width: 260, height: 60, background: "radial-gradient(ellipse, " + primaryColor + "80 0%, transparent 95%)", filter: "blur(40px)", opacity: useTransform(floatSpring, [-20, 20], [0.9, 0.3]), scale: useTransform(floatSpring, [-20, 20], [0.8, 1.4]), rotateX: 85, z: -250 }} />
      <motion.div style={{ rotateX: springX, rotateY: springY, y: floatSpring, transformStyle: "preserve-3d" }} className="relative w-full h-full flex items-center justify-center select-none">
        <motion.div className="absolute inset-0 blur-[100px] pointer-events-none rounded-full" style={{ backgroundColor: primaryColor, transform: "translateZ(-20px)", scale: glowScale, opacity: glowOpacity }} />
        {Array.from({ length: slices }).map((_, i) => {
          const zPos = (i - slices / 2) * (thickness / slices);
          const bevelScale = 1 - Math.pow(Math.abs(i - slices / 2) / (slices / 2), 2) * 0.06;
          return <img key={i} src={logoUrl} alt="" draggable={false} style={{ position: "absolute", width: 270, height: 270, objectFit: "contain", transform: "translateZ(" + zPos + "px) scale(" + bevelScale + ") " + (i === 0 ? "rotateY(180deg)" : ""), filter: "brightness(" + (0.7 + (Math.sin((i / slices) * Math.PI) * 0.3)) + ") blur(" + (Math.abs(zPos) * 0.12) + "px)", pointerEvents: "none", backfaceVisibility: (i === 0 || i === slices - 1) ? "hidden" : "visible", willChange: "transform" }} />;
        })}
        <motion.div className="absolute w-[300px] h-[300px] pointer-events-none overflow-hidden rounded-full" style={{ transform: "translateZ(20px)", mixBlendMode: "plus-lighter" }}>
          <motion.div className="w-full h-full blur-[15px]" style={{ background: "radial-gradient(circle at center, rgba(255,255,255,1) 0%, transparent 50%)", opacity: shimmerOpacity, x: envX, y: useTransform(springX, [-45, 45], [-60, 60]), scale: 2.5 }} />
        </motion.div>
        <motion.div className="absolute w-[350px] h-[2px] pointer-events-none z-50" style={{ background: "linear-gradient(90deg, transparent, " + primaryColor + ", white, " + primaryColor + ", transparent)", top: "50%", y: scanY, transform: "translateZ(25px)", boxShadow: "0 0 20px " + primaryColor, opacity: useTransform(springScan, [-100, -90, 90, 100], [0, 1, 1, 0]) }} />
        <motion.div className="absolute rounded-full border-2 border-white/5 pointer-events-none" style={{ width: 310, height: 310, transform: "translateZ(-10px)", scale: useTransform(velocity, [0, 20], [1, 1.15]) }} />
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: primaryColor + "30" }} />
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 15, repeat: Infinity, delay: 3 }} className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: "#8B5CF630" }} />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 10, repeat: Infinity, delay: 6 }} className="absolute top-[40%] right-[-5%] w-[300px] h-[300px] rounded-full blur-[80px] bg-blue-200 dark:bg-blue-900" />
      </div>
      <div className="relative z-10 text-center space-y-10 max-w-sm w-full">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute rounded-full border border-dashed opacity-[0.08] pointer-events-none" style={{ width: 290, height: 290, borderColor: primaryColor }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 34, repeat: Infinity, ease: "linear" }} className="absolute rounded-full border border-dashed opacity-[0.05] pointer-events-none" style={{ width: 250, height: 250, borderColor: "#8B5CF6" }} />
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
