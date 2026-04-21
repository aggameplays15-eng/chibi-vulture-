"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError } from "@/utils/toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      showError("Une erreur est survenue. Réessaie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm space-y-6">
          <div className="w-24 h-24 bg-green-50 rounded-[32px] flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Email envoyé !</h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Si cet email est associé à un compte, tu recevras un lien de réinitialisation dans quelques minutes.
            </p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black">
            Retour à la connexion
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
          <div className="w-20 h-20 bg-blue-500 rounded-[28px] flex items-center justify-center mx-auto shadow-lg shadow-blue-100 mb-4">
            <Mail className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">MOT DE PASSE OUBLIÉ</h1>
          <p className="text-gray-400 font-medium">Entre ton email pour recevoir un lien de réinitialisation.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold text-gray-700 ml-1">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-12 h-14 rounded-2xl border-gray-100 focus-visible:ring-blue-500"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg">
            {isLoading ? 'ENVOI...' : 'ENVOYER LE LIEN'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Tu te souviens ?{' '}
          <Link to="/login" className="text-pink-500 font-black hover:underline">Se connecter</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
