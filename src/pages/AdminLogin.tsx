"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Lock, ArrowRight, Home, KeyRound, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from "@/utils/toast";

type Step = 'credentials' | 'otp';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, adminVerifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1 — email + password
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminLogin({ email, password });
      setStep('otp');
      showSuccess("Code envoyé à l'adresse admin.");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      showError("Accès refusé. Informations incorrectes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — OTP
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits filled
    if (next.every(d => d !== '') && value) {
      verifyOtp(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split('');
      setOtp(next);
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    try {
      const ok = await adminVerifyOtp(code);
      if (ok) {
        showSuccess("Identité Admin confirmée. Bienvenue.");
        navigate('/admin');
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center space-y-6 mb-10">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-red-500/5">
            {step === 'credentials'
              ? <ShieldAlert className="text-red-500" size={32} />
              : <KeyRound className="text-red-500" size={32} />}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">Admin Terminal</h1>
            <p className="text-slate-500 text-sm font-medium">
              {step === 'credentials'
                ? "Zone d'accès restreinte. Authentification requise."
                : "Code de vérification envoyé à l'adresse admin."}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCredentials}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secure Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-white/5 border-white/10 text-white focus-visible:ring-red-500 placeholder:text-slate-700"
                  placeholder="admin@vulture.tech"
                  required
                  data-testid="admin-email-input"
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
                  data-testid="admin-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-2xl shadow-red-900/20 flex gap-2"
                data-testid="admin-submit-button"
              >
                {isLoading ? "VÉRIFICATION..." : "CONTINUER"}
                <ArrowRight size={20} />
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleOtpSubmit}
              className="space-y-6"
            >
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block text-center">
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
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                      data-testid={`otp-input-${i}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.some(d => d === '')}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-2xl shadow-red-900/20 flex gap-2"
                data-testid="otp-submit-button"
              >
                {isLoading ? "VÉRIFICATION..." : "DÉVERROUILLER"}
                <Lock size={20} />
              </Button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw size={14} />
                Recommencer
              </button>
            </motion.form>
          )}
        </AnimatePresence>

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
