"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, User, Bell, Shield, CreditCard, HelpCircle, LogOut, ChevronRight, Moon, Sun, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from '@/context/AppContext';
import { useTheme } from 'next-themes';

const Settings = () => {
  const navigate = useNavigate();
  const { logout, primaryColor } = useApp();
  const { theme, setTheme } = useTheme();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const darkMode = theme === 'dark';
  const toggleDarkMode = (val: boolean) => setTheme(val ? 'dark' : 'light');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sections = [
    { icon: User,        label: "Compte",         color: "text-blue-500",   bg: "bg-blue-50",   path: "/edit-profile" },
    { icon: Bell,        label: "Notifications",  color: "text-pink-500",   bg: "bg-pink-50",   toggle: notifEnabled,  onToggle: setNotifEnabled },
    { icon: darkMode ? Sun : Moon, label: "Mode sombre", color: "text-indigo-500", bg: "bg-indigo-50", toggle: darkMode, onToggle: toggleDarkMode },
    { icon: Shield,      label: "Confidentialité",color: "text-purple-500", bg: "bg-purple-50", path: "/terms" },
    { icon: CreditCard,  label: "Mes commandes",  color: "text-green-500",  bg: "bg-green-50",  path: "/orders" },
    { icon: HelpCircle,  label: "Aide & Support", color: "text-orange-500", bg: "bg-orange-50", path: "/support" },
  ];

  const canInstall = !!(window as any).deferredPrompt;

  const handleInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') (window as any).deferredPrompt = null;
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-black text-gray-800">PARAMÈTRES</h1>
      </header>

      <div className="px-6 space-y-8 pb-24">
        <div className="space-y-3">
          {sections.map((item) => (
            <div
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className="flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-50 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-gray-700">{item.label}</span>
              </div>
              {item.onToggle !== undefined ? (
                <Switch
                  checked={item.toggle}
                  onCheckedChange={item.onToggle}
                  onClick={e => e.stopPropagation()}
                  style={{ '--switch-checked': primaryColor } as React.CSSProperties}
                />
              ) : (
                <ChevronRight size={20} className="text-gray-300 group-hover:text-pink-500 transition-colors" />
              )}
            </div>
          ))}

          {canInstall && (
            <div
              onClick={handleInstall}
              className="flex items-center justify-between p-4 bg-white rounded-3xl border border-pink-100 shadow-sm hover:bg-pink-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-pink-50 text-pink-500 p-3 rounded-2xl">
                  <Download size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-700">Installer l'application</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Accès rapide sur l'écran d'accueil</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-pink-500 transition-colors" />
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button
            variant="ghost"
            className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 font-black flex gap-2"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            DÉCONNEXION
          </Button>
          <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-6">
            Version 1.0.4 • Chibi Vulture App
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;