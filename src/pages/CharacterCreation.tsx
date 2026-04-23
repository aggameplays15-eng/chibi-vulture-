"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Palette, Type as TypeIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { showSuccess } from "@/utils/toast";
import { useApp } from '@/context/AppContext';

const CharacterCreation = () => {
  const navigate = useNavigate();
  const { updateUser } = useApp();
  const [color, setColor] = useState("#EC4899");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const handleSave = () => {
    if (!name) {
      showSuccess("Donne un nom à ton Chibi ! 😊");
      return;
    }
    updateUser({ 
      name, 
      bio: bio || "Nouvel artiste Chibi en herbe ! ✨", 
      avatarColor: color 
    });
    showSuccess("Personnage créé avec succès ! ✨");
    navigate('/feed');
  };

  const colors = ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex flex-col items-center">
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl font-black text-pink-600">TON CHIBI</h1>
        <p className="text-gray-500 font-medium">Personnalise ton identité unique</p>
      </header>

      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[40px] bg-white border-4 border-pink-100 flex items-center justify-center overflow-hidden shadow-xl">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'Chibi'}&backgroundColor=${color.replace('#', '')}`} 
                alt="Preview" 
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold text-gray-700">
                <TypeIcon size={16} className="text-pink-500" /> Nom du personnage
              </Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Momo-chan" 
                className="rounded-xl border-pink-50 focus-visible:ring-pink-400" 
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold text-gray-700">
                <Palette size={16} className="text-pink-500" /> Couleur préférée
              </Label>
              <div className="flex gap-3 justify-between">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-4 ring-pink-200 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold text-gray-700">
                <Sparkles size={16} className="text-pink-500" /> Bio du personnage
              </Label>
              <Textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Raconte ton histoire..." 
                className="rounded-xl border-pink-50 focus-visible:ring-pink-400 min-h-[100px]" 
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleSave}
          className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-lg font-black shadow-lg shadow-pink-100"
        >
          C'EST PARTI !
        </Button>
      </div>
    </div>
  );
};

export default CharacterCreation;