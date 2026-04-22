"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Mail, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';

const PendingApproval = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6">
      {/* Fenêtre modale d'attente */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-sm w-full overflow-hidden"
      >
        {/* Header coloré */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 p-8 text-center">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
            className="w-20 h-20 bg-white/20 rounded-[24px] flex items-center justify-center mx-auto mb-4"
          >
            <Clock size={40} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-black text-white">Compte en attente</h1>
          <p className="text-pink-100 text-sm mt-1 font-medium">Approbation requise</p>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed text-center">
            Bonjour <strong>{user.name || 'artiste'}</strong> 👋<br />
            Ton compte <span className="text-pink-500 font-bold">{user.handle}</span> a bien été créé et est en cours de vérification par notre équipe.
          </p>

          {/* Étapes */}
          <div className="space-y-3 bg-pink-50 rounded-2xl p-4">
            <Step done label="Compte créé" />
            <Step active label="En attente d'approbation admin" />
            <Step label="Accès complet à la plateforme" />
          </div>

          {/* Info email */}
          <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
            <Mail size={18} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-blue-700 text-xs leading-relaxed">
              Tu recevras un email dès que ton compte sera approuvé. Vérifie aussi tes spams.
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 font-bold text-sm"
            onClick={logout}
          >
            <LogOut size={16} className="mr-2" />
            Se déconnecter
          </Button>
        </div>
      </motion.div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        Chibi Vulture · Le réseau social artistique
      </p>
    </div>
  );
};

const Step = ({ label, done = false, active = false }: { label: string; done?: boolean; active?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black
      ${done ? 'bg-green-400 text-white' : active ? 'bg-pink-500 text-white animate-pulse' : 'bg-gray-200 text-gray-400'}`}>
      {done ? '✓' : active ? '…' : '○'}
    </div>
    <span className={`text-sm font-semibold ${done ? 'text-green-600' : active ? 'text-pink-600' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

export default PendingApproval;
