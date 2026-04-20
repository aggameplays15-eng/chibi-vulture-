"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, Palette, Type, Save, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';

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
  const { logoUrl, updateLogo, primaryColor, updatePrimaryColor } = useApp();
  const [appName, setAppName] = useState('Chibi Vulture');
  const [appDescription, setAppDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showError("Le logo est trop lourd (max 2Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLogo(reader.result as string);
        showSuccess("Logo mis à jour ! ✨");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiService.updateAppSettings({
        app_name: appName,
        app_logo: logoUrl,
        app_description: appDescription,
        primary_color: primaryColor,
      });
      showSuccess('Paramètres sauvegardés ! ✨');
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAppearance = () => {
    updateLogo("https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture");
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
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
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
          <h3 className="font-black text-gray-900 text-lg">Logo</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Icône de l'application</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8 flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] bg-gray-50 border-4 border-dashed border-gray-100 flex items-center justify-center overflow-hidden shadow-inner">
                <img src={logoUrl} alt="Current Logo" className="w-24 h-24 object-contain" />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <Upload size={18} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 rounded-2xl font-black gap-2"
              style={{ backgroundColor: primaryColor }}
              variant="outline"
            >
              <ImageIcon size={18} /> CHANGER LE LOGO
            </Button>
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