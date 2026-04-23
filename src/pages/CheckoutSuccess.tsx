"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { primaryColor } = useApp();
  const orderId = (location.state as { orderId?: string })?.orderId || '—';

  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="space-y-8 max-w-sm w-full"
      >
        {/* Icône succès */}
        <div className="relative inline-block mx-auto">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-[40px] blur-2xl opacity-30"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="w-28 h-28 bg-white dark:bg-[hsl(224,20%,12%)] rounded-[40px] shadow-2xl flex items-center justify-center border-4 relative z-10"
            style={{ borderColor: `${primaryColor}30` }}>
            <CheckCircle2 size={56} style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">MERCI ! ✨</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">
            Ta commande <span className="font-black" style={{ color: primaryColor }}>#{orderId}</span> a été enregistrée avec succès.
          </p>
        </div>

        {/* Statut */}
        <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-[28px] border border-gray-100 dark:border-white/5 space-y-4 text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${primaryColor}15` }}>
              <Package size={22} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</p>
              <p className="font-black text-gray-900 dark:text-white">En attente de traitement</p>
            </div>
          </div>
          <div className="h-px bg-gray-100 dark:bg-white/5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Notre équipe va traiter ta commande et te contacter au numéro fourni pour confirmer la livraison.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 w-full">
          <Button onClick={() => navigate('/orders')}
            className="w-full h-14 rounded-2xl text-white text-base font-black shadow-lg flex gap-2"
            style={{ backgroundColor: primaryColor }}>
            <ClipboardList size={20} />
            VOIR MES COMMANDES
          </Button>
          <Button variant="ghost" onClick={() => navigate('/shop')}
            className="w-full h-12 rounded-2xl font-black flex gap-2 text-gray-500 dark:text-gray-400">
            <ShoppingBag size={18} />
            Continuer mes achats
          </Button>
          <Button variant="ghost" onClick={() => navigate('/feed')}
            className="w-full h-12 rounded-2xl font-black flex gap-2 text-gray-400 dark:text-gray-600 text-sm">
            <ArrowRight size={16} />
            Retour au fil d'actu
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
