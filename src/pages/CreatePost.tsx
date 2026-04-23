"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ImagePlus, X, Send, Tag, Camera, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import ImageCropper from '@/components/ImageCropper';
import { AnimatePresence } from 'framer-motion';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user, addPost } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Fichier invalide. Utilise une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("L'image est trop lourde (max 5Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCroppingImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => {
    // only reset if leaving the zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handlePublish = async () => {
    if (!image) { showError("Ajoute une image pour ton post ! 🎨"); return; }
    if (!caption.trim()) { showError("Écris une petite légende ! ✍️"); return; }

    setIsPublishing(true);
    try {
      const newPost = await apiService.createPost({ user_handle: user.handle, image, caption });
      if (newPost) addPost(newPost);
      showSuccess("Ton illustration a été publiée ! 🎨");
      navigate('/feed');
    } catch {
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

      <AnimatePresence>
        {croppingImage && (
          <ImageCropper
            image={croppingImage}
            aspectRatio={1}
            onCancel={() => setCroppingImage(null)}
            onCrop={(cropped) => {
              setImage(cropped);
              setCroppingImage(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="px-6 space-y-6 pb-10">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInput}
        />

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !image && fileInputRef.current?.click()}
          className={cn(
            "aspect-square rounded-3xl border-4 border-dashed transition-all overflow-hidden relative group",
            image
              ? "border-transparent cursor-default"
              : "cursor-pointer",
            isDragging
              ? "border-pink-400 bg-pink-50 scale-[1.01]"
              : !image && "border-pink-100 bg-pink-50/30 hover:bg-pink-50 hover:border-pink-200"
          )}
        >
          {image ? (
            <>
              <img src={image} alt="Preview" className="w-full h-full object-cover" />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-sm text-gray-700 hover:bg-white transition-colors"
                >
                  <Camera size={18} /> Changer
                </button>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-sm text-red-500 hover:bg-white transition-colors"
                >
                  <X size={18} /> Supprimer
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center transition-all",
                isDragging ? "bg-pink-100 scale-110" : "bg-white shadow-sm"
              )}>
                {isDragging
                  ? <Upload size={36} className="text-pink-500 animate-bounce" />
                  : <ImagePlus size={36} className="text-pink-400" />
                }
              </div>
              <div className="text-center">
                <p className="font-black text-gray-700 text-base">
                  {isDragging ? 'Dépose ton image ici !' : 'Glisse ton image ici'}
                </p>
                <p className="text-xs text-gray-400 mt-1">ou clique pour sélectionner · JPG, PNG, GIF · max 5Mo</p>
              </div>
            </div>
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
