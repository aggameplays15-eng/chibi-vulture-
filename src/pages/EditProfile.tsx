"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, Camera, User, FileText, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';
import ImageCropper from '@/components/ImageCropper';
import { AnimatePresence } from 'framer-motion';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatarImage || "");
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showError("Le nom ne peut pas être vide !");
      return;
    }
    updateUser({ 
      name, 
      bio, 
      avatar_image: avatar 
    });
    showSuccess("Profil mis à jour avec succès ! ✨");
    navigate('/profile');
  };

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-black text-gray-800">MODIFIER PROFIL</h1>
      </header>

      <AnimatePresence>
        {croppingImage && (
          <ImageCropper
            image={croppingImage}
            circular={true}
            onCancel={() => setCroppingImage(null)}
            onCrop={(cropped) => {
              setAvatar(cropped);
              setCroppingImage(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="px-6 space-y-8 pb-32">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="w-32 h-32 border-4 border-pink-100 shadow-xl overflow-hidden">
              <AvatarImage src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=${user.avatarColor.replace('#', '')}`} className="object-cover w-full h-full" />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white">
              <Camera size={20} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Changer l'avatar</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-bold text-gray-700">
              <User size={16} className="text-pink-500" /> Nom d'affichage
            </Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-pink-50 focus-visible:ring-pink-400 h-12" 
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-bold text-gray-700">
              <Sparkles size={16} className="text-pink-500" /> Nom d'utilisateur
            </Label>
            <Input 
              defaultValue={user.handle} 
              className="rounded-xl border-pink-50 focus-visible:ring-pink-400 h-12 bg-gray-50" 
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-bold text-gray-700">
              <FileText size={16} className="text-pink-500" /> Biographie
            </Label>
            <Textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl border-pink-50 focus-visible:ring-pink-400 min-h-[120px] text-sm leading-relaxed" 
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            variant="outline" 
            className="flex-1 h-14 rounded-2xl border-pink-100 text-pink-500 font-black"
            onClick={() => navigate(-1)}
          >
            ANNULER
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1 h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-lg font-black shadow-lg shadow-pink-100"
          >
            ENREGISTRER
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditProfile;