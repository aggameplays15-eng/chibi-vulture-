"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, ShieldCheck, Lock, Scale } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';

const Terms = () => {
  const navigate = useNavigate();
  const { primaryColor } = useApp();

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
        <h1 className="text-2xl font-black text-gray-800">LÉGAL</h1>
      </header>

      <div className="px-6 space-y-8 pb-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-pink-500">
            <Scale size={20} />
            <h2 className="font-black uppercase tracking-wider text-sm">Conditions d'utilisation</h2>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              En utilisant Chibi Vulture, vous acceptez de respecter nos règles communautaires. Tout contenu inapproprié ou violation des droits d'auteur entraînera une suspension immédiate du compte.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Les transactions effectuées sur la plateforme sont sécurisées. Chibi Vulture prélève une commission de 10% sur chaque vente pour assurer le fonctionnement du service.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-purple-500">
            <Lock size={20} />
            <h2 className="font-black uppercase tracking-wider text-sm">Confidentialité</h2>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-purple-50 space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              Vos données personnelles sont précieuses. Nous ne vendons jamais vos informations à des tiers. Nous utilisons vos données uniquement pour améliorer votre expérience et traiter vos commandes.
            </p>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl">
              <ShieldCheck className="text-purple-500" size={20} />
              <span className="text-[10px] font-bold text-purple-600 uppercase">Certifié conforme RGPD</span>
            </div>
          </div>
        </section>

        <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          Dernière mise à jour : 24 Mai 2024
        </p>
      </div>
    </MainLayout>
  );
};

export default Terms;