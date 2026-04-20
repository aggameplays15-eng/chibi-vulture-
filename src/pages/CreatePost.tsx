"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Image as ImageIcon, X, Send, Tag, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";

import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("L'image est trop lourde (max 5Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!image) {
      showError("Ajoute une image pour ton post ! 🎨");
      return;
    }
    if (!caption.trim()) {
      showError("Écris une petite légende ! ✍️");
      return;
    }

    setIsPublishing(true);
    try {
      await apiService.createPost({
        user_handle: user.handle,
        image: image, // Envoi en Base64 pour l'instant
        caption: caption
      });
      showSuccess("Ton illustration a été publiée ! 🎨");
      navigate('/feed');
    } catch (err) {
      showError("Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <MainLayout>
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">CRÉER UN POST</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X size={24} />
        </Button>
      </header>

      <div className="px-6 space-y-6 pb-10">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div 
          className="aspect-square rounded-3xl border-4 border-dashed border-pink-100 bg-pink-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50 transition-colors overflow-hidden relative group"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            <>
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" size={40} />
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-full shadow-sm mb-2">
                <ImageIcon size={32} className="text-pink-400" />
              </div>
              <p className="text-pink-400 font-bold text-sm">Ajouter une image</p>
              <p className="text-[10px] text-gray-400 mt-1">JPG, PNG ou GIF</p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Textarea 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Écris une légende sympa..." 
            className="rounded-2xl border-pink-50 focus-visible:ring-pink-400 min-h-[120px] text-lg"
          />
          
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
            <Input 
              placeholder="Ajouter des tags (ex: #chibi #art)" 
              className="pl-10 rounded-xl border-pink-50 focus-visible:ring-pink-400"
            />
          </div>
        </div>

        <Button 
          onClick={handlePublish}
          disabled={isPublishing}
          className="w-full h-14 rounded-2xl bg-pink-500 hover:bg-pink-600 text-lg font-black shadow-lg shadow-pink-100 flex gap-2"
        >
          <Send size={20} className={isPublishing ? "animate-pulse" : ""} />
          {isPublishing ? "PUBLICATION..." : "PUBLIER"}
        </Button>
      </div>
    </MainLayout>
  );
};

export default CreatePost;