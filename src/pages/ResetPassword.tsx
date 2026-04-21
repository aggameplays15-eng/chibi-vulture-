"use client";

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError } from "@/utils/toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { showError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { showError("Minimum 8 caractères."); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        showError(data.error || "Lien invalide ou expiré.");
        return;
      }
      setDone(true);
    } catch {
      showError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-center">
        <div className="space-y-4">
          <p className="text-gray-500 font-bold">Lien invalide.</p>
          <Button onClick={() => navigate('/forgot-password')} className="rounded-2xl">Demander un nouveau lien</Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm space-y-6">
          <div className="w-24 h-24 bg-green-50 rounded-[32px] flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Mot de passe modifié !</h1>
            <p className="text-gray-500">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black">
            Se connecter
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative">
      <Button variant="ghost" size="icon" className="absolute top-6 left-6 rounded-2xl bg-gray-50 text-gray-400" onClick={() => navigate(-1)}>
        <ChevronLeft size={24} />
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-pink-500 rounded-[28px] flex items-center justify-center mx-auto shadow-lg shadow-pink-100 mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">NOUVEAU MOT DE PASSE</h1>
          <p className="text-gray-400 font-medium">Choisis un nouveau mot de passe sécurisé.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="pl-12 h-14 rounded-2xl border-gray-100" required minLength={8} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Confirmer</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" className="pl-12 h-14 rounded-2xl border-gray-100" required minLength={8} />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg">
            {isLoading ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
