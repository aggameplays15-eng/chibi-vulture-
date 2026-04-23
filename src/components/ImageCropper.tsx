import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Button } from './ui/button';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { Slider } from './ui/slider';

interface ImageCropperProps {
  image: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circular?: boolean;
}

const ImageCropper = ({ image, onCrop, onCancel, aspectRatio = 1, circular = false }: ImageCropperProps) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // The mask size (it's responsive, so we measure it)
    const maskSize = rect.width > rect.height ? rect.height * 0.8 : rect.width * 0.8;
    const maskX = (rect.width - maskSize) / 2;
    const maskY = (rect.height - maskSize) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = maskSize * 2; // High DPI
    canvas.height = maskSize * 2;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // We calculate the position of the image relative to the mask
    // Image current dimensions
    const curWidth = img.clientWidth * zoom;
    const curHeight = img.clientHeight * zoom;
    
    // Image position relative to center
    const imgX = x.get() + (rect.width - img.clientWidth * zoom) / 2;
    const imgY = y.get() + (rect.height - img.clientHeight * zoom) / 2;

    // Position relative to mask start
    const relX = (maskX - imgX) / zoom;
    const relY = (maskY - imgY) / zoom;
    const relSize = maskSize / zoom;

    // Draw on canvas
    ctx.drawImage(
      img,
      (relX / img.clientWidth) * img.naturalWidth,
      (relY / img.clientHeight) * img.naturalHeight,
      (relSize / img.clientWidth) * img.naturalWidth,
      (relSize / img.clientHeight) * img.naturalHeight,
      0, 0, canvas.width, canvas.height
    );

    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  }, [onCrop, x, y, zoom]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">Ajuster l'image</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div 
          ref={containerRef}
          className="relative aspect-square w-full bg-black overflow-hidden rounded-[40px] border border-white/5 shadow-2xl touch-none"
        >
          {/* Draggable Image */}
          <motion.img
            ref={imgRef}
            src={image}
            style={{ x, y, scale: zoom }}
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            className="absolute cursor-move select-none"
            onDragStart={(e) => e.preventDefault()}
          />

          {/* Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div 
              className={`w-[80%] aspect-square border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-10 ${circular ? 'rounded-full' : 'rounded-2xl'}`}
            />
          </div>
          
          <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
            <p className="bg-black/40 backdrop-blur-md text-white/60 text-[10px] font-bold py-1.5 px-3 rounded-full uppercase tracking-wider border border-white/5">
              Glissez pour déplacer • Pincez pour zoomer
            </p>
          </div>
        </div>

        <div className="space-y-6 px-4">
          <div className="flex items-center gap-4">
            <ZoomOut size={18} className="text-white/40" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn size={18} className="text-white/40" />
          </div>

          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl font-bold bg-white text-black hover:bg-white/90 shadow-xl"
              onClick={handleCrop}
            >
              <Check size={20} className="mr-2" />
              Confirmer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
