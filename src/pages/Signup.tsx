"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";

import { apiService } from '@/services/api';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiService.createUser({
        name,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        email,
        bio: "",
        avatarColor: "#3b82f6",
        password
      });
      
      setStep(2);
      showSuccess("Compte créé avec succès ! 🎉");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('already exists') || message.includes('409')) {
        showError("Cet identifiant ou email est déjà utilisé.");
      } else {
        showError("Erreur lors de la création du compte. Réessaie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div data-testid="signup-success" className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm space-y-6"
        >
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mx-auto shadow-xl border-4 border-pink-100">
            <Sparkles className="text-pink-500" size={40} />
          </div>
          <div className="space-y-2">
            <h1 data-testid="patience-message" className="text-3xl font-black text-gray-900">COMPTE CRÉÉ ! 🎉</h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Ton compte est en attente d'approbation par un admin. Tu recevras un email dès que ton compte sera activé.
            </p>
            <p className="text-gray-400 text-sm">
              En attendant, tu peux explorer le site en mode invité.
            </p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100">
            Se connecter
          </Button>
        </motion.div>
      </div>
    );
  }

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
          <div className="w-20 h-20 bg-blue-500 rounded-[28px] flex items-center justify-center mx-auto shadow-lg shadow-blue-100 mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">REJOINDRE</h1>
          <p className="text-gray-400 font-medium">Crée ton identité Chibi unique 🎨</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Nom complet</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mamadou Diallo" data-testid="name-input" className="h-14 rounded-2xl border-gray-100 focus-visible:ring-blue-500" required />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" data-testid="email-input" className="h-14 rounded-2xl border-gray-100 focus-visible:ring-blue-500" required />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Identifiant</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Ton pseudo unique" data-testid="handle-input" className="h-14 rounded-2xl border-gray-100 focus-visible:ring-blue-500" required />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Mot de passe</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" data-testid="password-input" className="h-14 rounded-2xl border-gray-100 focus-visible:ring-blue-500" required />
          </div>

          <Button type="submit" disabled={isSubmitting} data-testid="signup-button" className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100">
            {isSubmitting ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 font-black hover:underline">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;