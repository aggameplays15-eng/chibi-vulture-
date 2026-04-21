"use client";

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Eye, ChevronLeft, KeyRound, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';

type Step = 'credentials' | 'otp';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginVerifyOtp, setGuestMode } = useApp();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Veuillez remplir tous les champs");
      return;
    }
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      if (result?.otpRequired) {
        setStep('otp');
        showSuccess("Code de vérification envoyé par email ✉️");
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        showSuccess("Connexion réussie ! ✨");
        navigate(result?.needsOnboarding ? '/onboarding' : '/feed');
      }
    } catch {
      showError("Identifiants incorrects.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every(d => d !== '') && value) verifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    try {
      const ok = await loginVerifyOtp(email, code);
      if (ok) {
        showSuccess("Connexion réussie ! ✨");
        navigate('/feed');
      } else {
        showError("Code invalide ou expiré.");
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtp(otp.join(''));
  };

  const handleGuest = () => {
    setGuestMode();
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
            {step === 'credentials' ? <Lock className="text-white" size={32} /> : <KeyRound className="text-white" size={32} />}
          </div>
          <h1 className="text-3xl font-black text-gray-900">CONNEXION</h1>
          <p className="text-gray-400 font-medium">
            {step === 'credentials' ? 'Heureux de vous revoir ! ✨' : 'Entrez le code reçu par email'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
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
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="submit-login"
                className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg shadow-xl shadow-gray-100 flex gap-2"
              >
                {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
                <ArrowRight size={20} />
              </Button>
              <p className="text-center text-sm text-gray-500 pt-2">
                Pas encore de compte ?{' '}
                <Link to="/signup" className="text-pink-500 font-black hover:underline">
                  S'inscrire
                </Link>
              </p>
              <p className="text-center text-sm">
                <Link to="/forgot-password" className="text-gray-400 hover:text-gray-600 font-bold text-xs">
                  Mot de passe oublié ?
                </Link>
              </p>
            </motion.form>
          ) : (            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block text-center">
                  Code à 6 chiffres
                </Label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border border-gray-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                    />
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg flex gap-2"
              >
                {isLoading ? 'VÉRIFICATION...' : 'CONFIRMER'}
                <Lock size={20} />
              </Button>
              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-gray-400 hover:text-gray-600 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={14} />
                Recommencer
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {step === 'credentials' && (
          <Button
            variant="ghost"
            onClick={handleGuest}
            data-testid="guest-button"
            className="w-full h-12 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 flex gap-2"
          >
            <Eye size={18} />
            Explorer en invité
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
