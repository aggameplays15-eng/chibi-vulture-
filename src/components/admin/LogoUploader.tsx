"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';
import ImageCropper from '../ImageCropper';
import { AnimatePresence } from 'framer-motion';

interface LogoUploaderProps {
  currentLogo: string;
  onLogoChange: (dataUrl: string) => void;
  maxSizeMb?: number;
  circular?: boolean;
}

const LogoUploader = ({ currentLogo, onLogoChange, maxSizeMb = 2, circular = false }: LogoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Fichier invalide. Utilise une image (JPG, PNG, SVG, WEBP).");
      return;
    }
    
    if (file.size > maxSizeMb * 1024 * 1024) {
      showError(`L'image est trop lourde (max ${maxSizeMb}Mo)`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCroppingImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [maxSizeMb]);

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
      <AnimatePresence>
        {croppingImage && (
          <ImageCropper
            image={croppingImage}
            circular={circular}
            onCancel={() => setCroppingImage(null)}
            onCrop={(cropped) => {
              setPreview(cropped);
              setCroppingImage(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-[32px] transition-all cursor-pointer",
          "flex flex-col items-center justify-center gap-4 py-10 px-6",
          isDragging
            ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]"
            : "border-gray-100 bg-gray-50/50 hover:border-indigo-200 hover:bg-indigo-50/20"
        )}
      >
        {/* Current logo display */}
        <div className="relative">
          <div className={cn(
            "w-28 h-28 rounded-[28px] bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 transition-all",
            isDragging ? "border-indigo-300 scale-110" : "border-white",
            circular && "rounded-full"
          )}>
            <img
              src={preview || currentLogo}
              alt="Logo"
              className="w-full h-full object-cover p-2"
            />
          </div>
          {isDragging && (
            <div className="absolute inset-0 rounded-[28px] bg-indigo-500/20 flex items-center justify-center">
              <Upload size={28} className="text-indigo-500 animate-bounce" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-black text-gray-800 uppercase tracking-widest">
            {isDragging ? 'Relâchez maintenant !' : 'Nouveau Logo'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Glissez-déposez ou cliquez ici
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
        <div className="bg-white border border-indigo-100 rounded-[28px] p-4 flex items-center gap-4 shadow-lg animate-in slide-in-from-bottom-2">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
            <img src={preview} alt="Aperçu" className="w-full h-full object-cover p-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Aperçu validé</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prêt à être déployé</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={cancelPreview}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all active:scale-90"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={confirmLogo}
              className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
            >
              <Check size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
