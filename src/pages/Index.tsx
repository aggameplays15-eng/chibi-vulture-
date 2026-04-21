"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Eye } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const Index = () => {
  const navigate = useNavigate();
  const { homeLogoUrl, primaryColor, setGuestMode } = useApp();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springX = useSpring(rotateX, { damping: 25, stiffness: 350 });
  const springY = useSpring(rotateY, { damping: 25, stiffness: 350 });

  const handlePan = (_: unknown, info: { delta: { x: number; y: number } }) => {
    rotateY.set(rotateY.get() + info.delta.x * 1.5);
    rotateX.set(rotateX.get() - info.delta.y * 1.5);
  };

  const handleGuest = () => {
    setGuestMode();
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-12 border-2 border-dashed rounded-full opacity-5 pointer-events-none"
              style={{ borderColor: primaryColor }}
            />
            <motion.div
              onPan={handlePan}
              style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
              whileTap={{ scale: 1.1 }}
              className="w-56 h-56 sm:w-64 sm:h-64 mx-auto relative cursor-grab active:cursor-grabbing"
            >
              <div
                className="absolute inset-0 bg-white rounded-[70px] shadow-[0_30px_80px_rgba(0,0,0,0.1)] flex items-center justify-center border border-gray-50"
                style={{ backfaceVisibility: 'hidden', transform: 'translateZ(1px)', WebkitBackfaceVisibility: 'hidden' }}
              >
                <img src={homeLogoUrl} alt="Chibi Vulture Logo" width={176} height={176} className="w-44 h-44 object-contain drop-shadow-xl" />
              </div>
              <div
                className="absolute inset-0 bg-white rounded-[70px] flex items-center justify-center border border-gray-100"
                style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <img src={homeLogoUrl} alt="" width={176} height={176} className="w-44 h-44 object-contain opacity-40" />
              </div>
            </motion.div>
          </div>

          <div className="space-y-3 pt-8">
            <h1 className="text-6xl font-black text-gray-900 tracking-tighter leading-[0.9]">
              CHIBI<br />
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

          <Link to="/signup">
            <Button
              variant="outline"
              className="w-full h-16 rounded-[28px] text-gray-700 text-lg font-bold border-gray-100 hover:bg-gray-50 transition-all flex gap-2"
            >
              <UserPlus size={20} />
              CRÉER UN COMPTE
            </Button>
          </Link>

          <Button
            variant="ghost"
            onClick={handleGuest}
            data-testid="guest-button"
            className="w-full h-14 rounded-[28px] text-gray-400 text-base font-bold hover:bg-gray-50 transition-all flex gap-2"
          >
            <Eye size={18} />
            Explorer en invité
          </Button>
        </div>

        <div className="pt-4">
          <Link to="/goated" className="text-[9px] text-gray-300 hover:text-gray-500 font-black uppercase tracking-[0.4em] transition-colors">
            Admin Panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
