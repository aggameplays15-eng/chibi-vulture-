"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Palette, Type, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
import LogoUploader from './LogoUploader';

const DEFAULT_LOGO = "https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture";

const PRESET_COLORS = [
  { name: "Rose Chibi", value: "#EC4899" },
  { name: "Violet Royal", value: "#8B5CF6" },
  { name: "Bleu Azur", value: "#3B82F6" },
  { name: "Vert Menthe", value: "#10B981" },
  { name: "Orange Sunset", value: "#F59E0B" },
  { name: "Rouge Passion", value: "#EF4444" },
  { name: "Noir Élégant", value: "#1F2937" }
];

const LogoManagement = () => {
  const { headerLogoUrl, homeLogoUrl, updateHeaderLogo, updateHomeLogo, primaryColor, updatePrimaryColor, pwaIconUrl, updatePwaIcon, appName: ctxAppName, updateAppName } = useApp();
  const [appName, setAppName] = useState('Chibi Vulture');
  const [appDescription, setAppDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from API on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await apiService.getAppSettings();
      if (settings.app_name) setAppName(settings.app_name);
      if (settings.app_description) setAppDescription(settings.app_description);
    } catch (error) {
      console.error('Failed to load app settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiService.updateAppSettings({
        app_name: appName,
        app_logo: headerLogoUrl,
        pwa_icon: pwaIconUrl || headerLogoUrl,
        app_description: appDescription,
        primary_color: primaryColor,
      });
      // Mettre à jour le contexte global
      updateAppName(appName);
      showSuccess('Paramètres sauvegardés ! ✨');
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAppearance = () => {
    updateHeaderLogo(DEFAULT_LOGO);
    updateHomeLogo(DEFAULT_LOGO);
    updatePrimaryColor("#EC4899");
    setAppName('Chibi Vulture');
    setAppDescription('');
    showSuccess("Apparence réinitialisée ! 🔄");
  };

  return (
    <div className="space-y-8">
      {/* App Name Section */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Nom de l'Application</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Marque et identité</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                Nom de l'app
              </Label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Ex: Chibi Vulture"
                  className="h-12 rounded-2xl border-gray-100 pl-12 font-bold"
                  disabled={isLoading}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                Description courte
              </Label>
              <Input
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="Ex: Le réseau social artistique"
                className="h-12 rounded-2xl border-gray-100 font-bold"
                disabled={isLoading}
                maxLength={50}
              />
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Aperçu</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <img src={headerLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{appName || 'Nom de l\'app'}</p>
                  <p className="text-xs text-gray-400">{appDescription || 'Description...'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Logo Section */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Logos</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Header et page d'accueil</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 space-y-6">

            {/* Header logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Logo Header</p>
                <span className="text-[10px] text-gray-400 font-medium">— barre de navigation</span>
              </div>
              <LogoUploader
                currentLogo={headerLogoUrl}
                onLogoChange={(dataUrl) => {
                  updateHeaderLogo(dataUrl);
                  showSuccess("Logo header mis à jour ! ✨");
                }}
              />
              {/* Header preview */}
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Aperçu header</p>
                <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
                    <img src={headerLogoUrl} alt="header" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                  <div className="w-6 h-6 rounded-lg bg-gray-100" />
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Home logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Logo Accueil</p>
                <span className="text-[10px] text-gray-400 font-medium">— page principale</span>
              </div>
              <LogoUploader
                currentLogo={homeLogoUrl}
                onLogoChange={(dataUrl) => {
                  updateHomeLogo(dataUrl);
                  showSuccess("Logo accueil mis à jour ! ✨");
                }}
              />
              {/* Home preview */}
              <div className="bg-gray-50 rounded-2xl p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Aperçu accueil</p>
                <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm">
                  <div className="w-16 h-16 rounded-[20px] bg-white shadow-md flex items-center justify-center overflow-hidden border-2 border-gray-100">
                    <img src={homeLogoUrl} alt="home" className="w-12 h-12 object-contain" />
                  </div>
                  <div className="w-16 h-2 bg-gray-100 rounded-full" />
                  <div className="w-10 h-2 bg-gray-100 rounded-full" />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Thème Couleur</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Couleur principale de l'interface</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    updatePrimaryColor(color.value);
                    showSuccess(`Thème ${color.name} activé ! ✨`);
                  }}
                  className={`w-10 h-10 rounded-full transition-all relative ${primaryColor === color.value ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color.value, borderColor: color.value }}
                  title={color.name}
                >
                  {primaryColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <Palette size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => updatePrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
              />
              <div className="flex-1">
                <p className="text-xs font-black text-gray-900 uppercase">Couleur personnalisée</p>
                <p className="text-[10px] text-gray-400 font-bold">{primaryColor.toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section PWA */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Icône PWA</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Logo affiché lors de l'installation sur mobile</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 space-y-4">
            <LogoUploader
              currentLogo={pwaIconUrl || headerLogoUrl}
              onLogoChange={(dataUrl) => {
                updatePwaIcon(dataUrl);
                showSuccess("Icône PWA mise à jour ! 📱");
              }}
            />

            {/* Aperçu installation mobile */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-3">Aperçu installation mobile</p>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-lg overflow-hidden"
                  style={{ backgroundColor: primaryColor + '20', border: `2px solid ${primaryColor}30` }}
                >
                  <img
                    src={pwaIconUrl || headerLogoUrl}
                    alt="PWA icon"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <p className="text-xs font-black text-gray-800 text-center">{appName}</p>
                <p className="text-[10px] text-gray-400">Comme ça apparaîtra sur l'écran d'accueil</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl">
              <p className="text-[10px] text-blue-600 font-bold">
                💡 Utilise une image carrée PNG/JPG de 512×512px minimum pour un meilleur rendu.
                Les utilisateurs déjà installés devront réinstaller l'app pour voir le changement.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Button 
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full h-14 rounded-2xl font-black text-lg gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {isSaving ? 'SAUVEGARDE...' : 'SAUVEGARDER'}
      </Button>

      <Button 
        variant="ghost" 
        onClick={resetAppearance}
        className="w-full h-12 rounded-2xl text-gray-400 hover:text-gray-600 font-bold gap-2"
      >
        <RefreshCw size={18} />
        Réinitialiser
      </Button>
    </div>
  );
};

export default LogoManagement;