"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, ArrowRight, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from '@/context/AppContext';
import { showError, showSuccess } from "@/utils/toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await adminLogin({ email, password });
      if (success) {
        showSuccess("Identité Admin confirmée. Bienvenue.");
        navigate('/admin');
      } else {
        showError("Accès refusé. Informations incorrectes.");
      }
    } catch (error) {
      showError("Erreur de connexion serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dark Aesthetics */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center space-y-6 mb-10">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-red-500/5">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Admin Terminal</h1>
            <p className="text-slate-500 text-sm font-medium">Zone d'accès restreinte. Authentification requise.</p>
          </div>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus-visible:ring-red-500 placeholder:text-slate-700" 
              placeholder="admin@vulture.tech"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access Key</Label>
            <Input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus-visible:ring-red-500 placeholder:text-slate-700" 
              placeholder="••••••••"
              required 
            />
          </div>

          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-2xl shadow-red-900/20 flex gap-2"
          >
            {isLoading ? "VÉRIFICATION..." : "DÉVERROUILLER"}
            <ArrowRight size={20} />
          </Button>
        </form>

        <div className="mt-8 flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-white hover:bg-white/5 transition-colors gap-2"
          >
            <Home size={16} />
            Retour au site public
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
