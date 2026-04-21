"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, ClipboardList } from 'lucide-react';
import { Button } from "@/components/ui/button";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = (location.state as { orderId?: string })?.orderId || 'CV-XXXX';

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="space-y-8 max-w-sm"
      >
        <div className="relative inline-block">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-green-200 rounded-full blur-2xl opacity-40"
          />
          <div className="w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center border-4 border-green-100 relative z-10">
            <CheckCircle2 size={64} className="text-green-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-800">MERCI ! ✨</h1>
          <p className="text-gray-500 font-medium">
            Ta commande <span className="text-pink-500 font-bold">#{orderId}</span> a été validée avec succès.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50 space-y-4">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-pink-50 p-3 rounded-2xl text-pink-500">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Statut</p>
              <p className="font-black text-gray-800">En préparation</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Tu recevras un email de confirmation avec les détails de ta livraison d'ici quelques minutes.
          </p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/orders')}
            className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-lg font-black shadow-lg shadow-pink-100 flex gap-2"
          >
            <ClipboardList size={20} />
            VOIR MES COMMANDES
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="w-full h-14 rounded-2xl text-gray-500 font-black flex gap-2"
          >
            <ArrowRight size={20} />
            RETOUR AU FIL D'ACTU
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="w-full h-12 rounded-2xl text-pink-500 font-black flex gap-2"
          >
            <ShoppingBag size={20} />
            CONTINUER MES ACHATS
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;