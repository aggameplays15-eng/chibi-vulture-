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
  const { login, loginVerifyOtp, setGuestMode, primaryColor } = useApp();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-white dark:bg-[hsl(224,20%,7%)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background blob */}
      <div
        className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-6 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={24} />
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Icon + Title */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl mb-4"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 20px 50px ${primaryColor}40`,
            }}
          >
            {step === 'credentials' ? <Lock className="text-white" size={30} /> : <KeyRound className="text-white" size={30} />}
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {step === 'credentials' ? 'CONNEXION' : 'VÉRIFICATION'}
          </h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">
            {step === 'credentials' ? 'Heureux de vous revoir ✨' : 'Entrez le code reçu par email'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    data-testid="email-input"
                    className="pl-12 h-14 rounded-2xl border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-2"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider ml-1">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    data-testid="password-input"
                    className="pl-12 pr-12 h-14 rounded-2xl border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-2"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                data-testid="submit-login"
                className="w-full h-14 rounded-2xl text-white font-black text-base shadow-xl flex gap-2 mt-2"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 16px 40px ${primaryColor}40`,
                }}
              >
                {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
                {!isLoading && <ArrowRight size={20} />}
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-500 pt-1">
                Pas encore de compte ?{' '}
                <Link to="/signup" className="font-black hover:underline" style={{ color: primaryColor }}>
                  S'inscrire
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 text-center">
                  Code à 6 chiffres
                </p>
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
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all"
                      style={{ '--tw-ring-color': primaryColor, focusBorderColor: primaryColor } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full h-14 rounded-2xl text-white font-black text-base flex gap-2"
                style={{ backgroundColor: primaryColor, boxShadow: `0 16px 40px ${primaryColor}40` }}
              >
                {isLoading ? 'VÉRIFICATION...' : 'CONFIRMER'}
                {!isLoading && <Lock size={18} />}
              </Button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center justify-center gap-2 transition-colors font-semibold"
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
            className="w-full h-12 rounded-2xl text-gray-400 dark:text-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 flex gap-2"
          >
            <Eye size={16} />
            Explorer en invité
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
