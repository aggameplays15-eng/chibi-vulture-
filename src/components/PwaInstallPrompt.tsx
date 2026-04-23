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
  const { primaryColor } = useApp();
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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[200] bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4"
        >
          <div className="p-3 rounded-2xl flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
            <Download size={22} style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm text-gray-900">Installer l'app</p>
            <p className="text-xs text-gray-400 font-medium">Accès rapide depuis ton écran d'accueil</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="rounded-xl font-black text-white text-xs px-3"
              style={{ backgroundColor: primaryColor }}
              onClick={handleInstall}
            >
              Installer
            </Button>
            <button onClick={handleDismiss} className="text-gray-300 hover:text-gray-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PwaInstallPrompt;
