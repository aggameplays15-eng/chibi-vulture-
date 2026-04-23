"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PwaInstallPrompt = () => {
  const { primaryColor, appName, headerLogoUrl, pwaIconUrl } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_dismissed', '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed left-1/2 w-[92%] max-w-sm z-[200] bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/20 p-5 flex items-center gap-4"
          style={{ bottom: 'calc(var(--safe-area-bottom) + 96px)' }}
        >
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden border border-gray-50">
              <img src={pwaIconUrl || headerLogoUrl} alt="Logo" className="w-11 h-11 object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white">
              <Download size={10} strokeWidth={3} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-gray-900 uppercase tracking-tight">{appName}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ajouter à l'écran d'accueil</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="rounded-xl font-black text-white text-[10px] px-4 h-9 shadow-lg shadow-pink-500/20 active:scale-95 transition-transform"
              style={{ backgroundColor: primaryColor }}
              onClick={handleInstall}
            >
              INSTALLER
            </Button>
            <button 
              onClick={handleDismiss} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors active:scale-90"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
