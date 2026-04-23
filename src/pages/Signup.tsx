"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';

const Signup = () => {
  const navigate = useNavigate();
  const { primaryColor, headerLogoUrl, signup } = useApp();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState('#94a3b8');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signup({
        name,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        email,
        bio: "",
        avatarColor: primaryColor,
        password
      });
      
      showSuccess("Bienvenue ! Ton compte est prêt. ✨");
      navigate('/feed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('already exists') || message.includes('409')) {
        showError("Cet identifiant ou email est déjà utilisé.");
      } else {
        showError(message || "Erreur lors de la création du compte. Réessaie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div
        className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400"
        onClick={handleBack}
      >
        <ChevronLeft size={24} />
      </Button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div 
            className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center mx-auto shadow-lg mb-4 overflow-hidden"
            style={{ border: `2px solid ${primaryColor}20`, boxShadow: `0 20px 40px ${primaryColor}30` }}
          >
            <img src={headerLogoUrl || "/favicon.ico"} alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">REJOINDRE</h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium">Crée ton identité {headerLogoUrl ? '' : 'Chibi '}unique 🎨</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 dark:text-gray-300 ml-1">Nom complet</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Mamadou Diallo" 
              data-testid="name-input" 
              className="h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 dark:text-gray-300 ml-1">Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="votre@email.com" 
              data-testid="email-input" 
              className="h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 dark:text-gray-300 ml-1">Identifiant</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold select-none">@</span>
              <Input
                value={handle.replace(/^@/, '')}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="ton_pseudo"
                data-testid="handle-input"
                className="pl-8 h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
                maxLength={20}
                required
              />
            </div>
            <p className="text-[10px] text-gray-400 ml-1">3-20 caractères, lettres, chiffres et _</p>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 dark:text-gray-300 ml-1">Mot de passe</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              data-testid="password-input" 
              className="h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white" 
              required 
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            data-testid="signup-button" 
            className="w-full h-14 rounded-2xl text-white font-black text-lg shadow-xl"
            style={{ backgroundColor: primaryColor, boxShadow: `0 16px 40px ${primaryColor}40` }}
          >
            {isSubmitting ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-black hover:underline" style={{ color: primaryColor }}>
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>

  );
};

export default Signup;