"use client";

import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        showSuccess("Logo mis à jour avec succès ! ✨");
      };
      reader.readAsDataURL(file);
    }
  };

  const resetAppearance = () => {
    updateLogo("https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture");
    updatePrimaryColor("#EC4899");
    showSuccess("Apparence réinitialisée ! 🔄");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Identité Visuelle</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Logo de l'application</p>
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
        variant="ghost" 
        onClick={resetAppearance}
        className="w-full h-12 rounded-2xl text-gray-400 hover:text-gray-600 font-bold gap-2"
      >
        <RefreshCw size={18} />
        Réinitialiser l'apparence
      </Button>
    </div>
  );
};

export default LogoManagement;