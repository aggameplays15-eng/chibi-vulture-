"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, ImagePlus, GripVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  id: string;
  dataUrl: string;
  file: File;
  isPrimary: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

const ImageUploader = ({ images, onChange, maxImages = 6 }: ImageUploaderProps) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: File[]) => {
    const validFiles = files
      .filter(f => f.type.startsWith('image/'))
      .slice(0, maxImages - images.length);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange([
          ...images,
          {
            id: `${Date.now()}-${Math.random()}`,
            dataUrl,
            file,
            isPrimary: images.length === 0,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Drop zone handlers
  const onDropZone = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    readFiles(files);
  }, [images, onChange]);

  const onDragOverZone = (e: React.DragEvent) => {
    e.preventDefault();
    // Only show drop highlight if dragging external files (not reordering)
    if (!draggedId) setIsDraggingOver(true);
  };

  const onDragLeaveZone = () => setIsDraggingOver(false);

  // Reorder drag handlers
  const onDragStartThumb = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverThumb = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const onDropThumb = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const from = images.findIndex(i => i.id === draggedId);
    const to = images.findIndex(i => i.id === targetId);
    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    // First image is always primary
    onChange(reordered.map((img, idx) => ({ ...img, isPrimary: idx === 0 })));
    setDraggedId(null);
    setDragOverId(null);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const remove = (id: string) => {
    const filtered = images.filter(i => i.id !== id);
    onChange(filtered.map((img, idx) => ({ ...img, isPrimary: idx === 0 })));
  };

  const setPrimary = (id: string) => {
    const idx = images.findIndex(i => i.id === id);
    if (idx === 0) return;
    const reordered = [...images];
    const [moved] = reordered.splice(idx, 1);
    reordered.unshift(moved);
    onChange(reordered.map((img, i) => ({ ...img, isPrimary: i === 0 })));
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={onDropZone}
        onDragOver={onDragOverZone}
        onDragLeave={onDragLeaveZone}
        onClick={() => images.length < maxImages && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl transition-all cursor-pointer select-none",
          "flex flex-col items-center justify-center gap-2 py-8",
          isDraggingOver
            ? "border-pink-400 bg-pink-50 scale-[1.01]"
            : "border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50/40",
          images.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          {isDraggingOver
            ? <Upload size={22} className="text-pink-500 animate-bounce" />
            : <ImagePlus size={22} className="text-gray-400" />
          }
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-gray-700">
            {isDraggingOver ? 'Dépose ici !' : 'Glisse tes images ici'}
          </p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            ou clique pour sélectionner · JPG, PNG, WEBP · max {maxImages} images
          </p>
        </div>
        {images.length > 0 && (
          <span className="absolute top-3 right-3 text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
            {images.length}/{maxImages}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files) readFiles(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
      </div>

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={e => onDragStartThumb(e, img.id)}
              onDragOver={e => onDragOverThumb(e, img.id)}
              onDrop={e => onDropThumb(e, img.id)}
              onDragEnd={onDragEnd}
              className={cn(
                "relative aspect-square rounded-2xl overflow-hidden group border-2 transition-all cursor-grab active:cursor-grabbing",
                img.isPrimary ? "border-pink-400 shadow-md" : "border-transparent",
                dragOverId === img.id && "scale-105 border-pink-300",
                draggedId === img.id && "opacity-40"
              )}
            >
              <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="bg-white/90 p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                    title="Définir comme image principale"
                  >
                    <Star size={13} className="text-yellow-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="bg-white/90 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <X size={13} className="text-red-500" />
                </button>
                <div className="bg-white/90 p-1.5 rounded-lg cursor-grab">
                  <GripVertical size={13} className="text-gray-400" />
                </div>
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1.5 left-1.5 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={8} fill="white" /> PRINCIPALE
                </div>
              )}
            </div>
          ))}

          {/* Add more slot */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50/40 transition-all flex items-center justify-center text-gray-300 hover:text-pink-400"
            >
              <ImagePlus size={22} />
            </button>
          )}
        </div>
      )}

      {images.length > 1 && (
        <p className="text-[10px] text-gray-400 font-medium text-center">
          Glisse pour réordonner · ⭐ pour définir l'image principale
        </p>
      )}
    </div>
  );
};

export type { UploadedImage };
export default ImageUploader;
