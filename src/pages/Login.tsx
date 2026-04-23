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
  const { user, login, setGuestMode, primaryColor, headerLogoUrl } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError("Veuillez remplir tous les champs");
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      showSuccess("Connexion réussie ! ✨");
      navigate('/feed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Identifiants incorrects.";
      showError(message);
    } finally {
      setIsLoading(false);
    }
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
            className="w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl mb-4 overflow-hidden bg-white"
            style={{
              boxShadow: `0 20px 50px ${primaryColor}40`,
              border: `2px solid ${primaryColor}20`
            }}
          >
            <img 
              src={headerLogoUrl || "/favicon.ico"} 
              alt="Logo" 
              className="w-14 h-14 object-contain" 
            />
          </motion.div>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            CONNEXION
          </h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">
            Heureux de vous revoir ✨
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
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

        {/* Bouton Invité Premium */}
        {!user?.isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative group">
              <div 
                className="absolute -inset-0.5 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <Button
                variant="ghost"
                onClick={handleGuest}
                data-testid="guest-button"
                className="relative w-full h-14 rounded-[22px] bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 font-black hover:bg-gray-50 dark:hover:bg-white/10 flex gap-3 transition-all scale-100 active:scale-95 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-white/10">
                  <Eye size={18} style={{ color: primaryColor }} />
                </div>
                EXPLORER SANS COMPTE
              </Button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-3 font-bold uppercase tracking-widest">
              Accès limité aux contenus publics
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
