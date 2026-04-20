"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Eye, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, setGuestMode } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email && password) {
      const success = await login({ email: email, password: password });
      if (success) {
        showSuccess("Connexion réussie ! ✨");
        navigate('/feed');
      } else {
        showError("Identifiants incorrects.");
      }
    } else {
      showError("Veuillez remplir tous les champs");
    }
  };

  const handleGuest = () => {
    setGuestMode();
    showSuccess("Mode invité activé ! 👀");
    navigate('/feed');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 rounded-2xl bg-gray-50 text-gray-400"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={24} />
      </Button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-pink-500 rounded-[28px] flex items-center justify-center mx-auto shadow-lg shadow-pink-100 mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">CONNEXION</h1>
          <p className="text-gray-400 font-medium">Heureux de vous revoir ! ✨</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com" 
                data-testid="email-input"
                className="pl-12 h-14 rounded-2xl border-gray-100 focus-visible:ring-pink-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                data-testid="password-input"
                className="pl-12 h-14 rounded-2xl border-gray-100 focus-visible:ring-pink-500"
              />
            </div>
          </div>

          <Button type="submit" data-testid="submit-login" className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg shadow-xl shadow-gray-100 flex gap-2">
            SE CONNECTER
            <ArrowRight size={20} />
          </Button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">OU</span></div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleGuest}
          data-testid="guest-button"
          className="w-full h-14 rounded-2xl border-gray-100 text-gray-500 font-bold flex gap-2 hover:bg-gray-50"
        >
          <Eye size={20} />
          CONTINUER EN INVITÉ
        </Button>

        <p className="text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-pink-500 font-black hover:underline">
            S'inscrire
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;