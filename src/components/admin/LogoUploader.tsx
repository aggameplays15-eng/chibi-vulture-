"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ImagePlus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';

interface LogoUploaderProps {
  currentLogo: string;
  onLogoChange: (dataUrl: string) => void;
  maxSizeMb?: number;
}

const LogoUploader = ({ currentLogo, onLogoChange, maxSizeMb = 2 }: LogoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max size 512px for logos
          const MAX_SIZE = 512;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Use JPEG for better compression, or PNG if transparent
          const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(type, 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Fichier invalide. Utilise une image (JPG, PNG, SVG, WEBP).");
      return;
    }
    
    try {
      const compressedDataUrl = await compressImage(file);
      setPreview(compressedDataUrl);
    } catch (error) {
      showError("Erreur lors du traitement de l'image.");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const confirmLogo = () => {
    if (preview) {
      onLogoChange(preview);
      setPreview(null);
    }
  };

  const cancelPreview = () => setPreview(null);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-3 py-8 px-4",
          isDragging
            ? "border-pink-400 bg-pink-50 scale-[1.01]"
            : "border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50/40"
        )}
      >
        {/* Current logo display */}
        <div className="relative">
          <div className={cn(
            "w-24 h-24 rounded-[28px] bg-white shadow-md flex items-center justify-center overflow-hidden border-4 transition-all",
            isDragging ? "border-pink-300 scale-110" : "border-gray-100"
          )}>
            <img
              src={preview || currentLogo}
              alt="Logo actuel"
              className="w-16 h-16 object-contain"
            />
          </div>
          {isDragging && (
            <div className="absolute inset-0 rounded-[28px] bg-pink-500/20 flex items-center justify-center">
              <Upload size={28} className="text-pink-500 animate-bounce" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-black text-gray-700">
            {isDragging ? 'Dépose ton logo ici !' : 'Glisse ton logo ici'}
          </p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            ou clique pour sélectionner · PNG, SVG, WEBP · max {maxSizeMb}Mo
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInput}
        />
      </div>

      {/* Preview confirmation */}
      {preview && (
        <div className="bg-white border-2 border-pink-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
            <img src={preview} alt="Aperçu" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-800">Nouveau logo prêt</p>
            <p className="text-[11px] text-gray-400">Confirme pour l'appliquer partout</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={cancelPreview}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-gray-400 hover:text-red-500" />
            </button>
            <button
              type="button"
              onClick={confirmLogo}
              className="w-9 h-9 rounded-xl bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            >
              <Check size={15} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
