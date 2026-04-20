"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { primaryColor } = useApp();

  useEffect(() => {
    console.error('404 — route inexistante :', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm space-y-8"
      >
        <div className="space-y-2">
          <p className="text-8xl font-black text-gray-100">404</p>
          <h1 className="text-2xl font-black text-gray-900 -mt-4">PAGE INTROUVABLE</h1>
          <p className="text-gray-400 font-medium">
            Cette page n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full h-14 rounded-2xl font-bold flex gap-2 border-gray-100"
          >
            <ArrowLeft size={18} />
            Retour
          </Button>
          <Button
            onClick={() => navigate('/feed')}
            className="w-full h-14 rounded-2xl font-black text-white flex gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <Home size={18} />
            Accueil
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
