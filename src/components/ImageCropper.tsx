import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Button } from './ui/button';
import { X, ZoomIn, ZoomOut, Check, RotateCw, Grid } from 'lucide-react';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface ImageCropperProps {
  image: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circular?: boolean;
}

const ImageCropper = ({ image, onCrop, onCancel, aspectRatio = 1, circular = false }: ImageCropperProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useSpring(rotation, { stiffness: 200, damping: 25 });

  const handleRotate = () => {
    setRotation(prev => prev + 90);
  };

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Taille du masque en pixels UI (même logique que le masque visuel)
    const maxMaskSize = Math.min(rect.width, rect.height) * 0.8;
    let maskWidth: number;
    let maskHeight: number;

    if (aspectRatio >= 1) {
      maskWidth = maxMaskSize;
      maskHeight = maxMaskSize / aspectRatio;
    } else {
      maskHeight = maxMaskSize;
      maskWidth = maxMaskSize * aspectRatio;
    }

    // Résolution du canvas de sortie (proportionnelle au ratio)
    const BASE = 1000;
    const canvasWidth  = aspectRatio >= 1 ? BASE : Math.round(BASE * aspectRatio);
    const canvasHeight = aspectRatio >= 1 ? Math.round(BASE / aspectRatio) : BASE;

    const canvas = document.createElement('canvas');
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Facteur de conversion pixels-UI → pixels-canvas
    const uiToCanvasX = canvasWidth  / maskWidth;
    const uiToCanvasY = canvasHeight / maskHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Centre du canvas, rotation, zoom
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Déplacement UI converti en espace canvas (sans diviser par zoom car
    // ctx.scale l'applique déjà aux coordonnées de drawImage)
    const offsetX = x.get() * uiToCanvasX;
    const offsetY = y.get() * uiToCanvasY;

    ctx.drawImage(
      img,
      -img.naturalWidth  / 2 + offsetX,
      -img.naturalHeight / 2 + offsetY,
      img.naturalWidth,
      img.naturalHeight
    );

    onCrop(canvas.toDataURL('image/jpeg', 0.95));
  }, [onCrop, x, y, zoom, rotation, aspectRatio]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/98 flex flex-col items-center justify-center p-4 backdrop-blur-xl">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h3 className="text-white font-black uppercase tracking-widest text-xs">Cadrage & Style</h3>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Ajustez pour un rendu parfait</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div 
          ref={containerRef}
          className="relative aspect-square w-full bg-[#0a0a0a] overflow-hidden rounded-[48px] border border-white/5 shadow-2xl touch-none group"
        >
          {/* Draggable Image */}
          <motion.img
            ref={imgRef}
            src={image}
            style={{ x, y, scale: zoom, rotate }}
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            className="absolute cursor-move select-none"
            onDragStart={(e) => e.preventDefault()}
          />

          {/* Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div
              style={{
                width: aspectRatio >= 1 ? '80%' : `${80 * aspectRatio}%`,
                height: aspectRatio >= 1 ? `${80 / aspectRatio}%` : '80%',
              }}
              className={cn(
                "border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 relative overflow-hidden",
                circular ? 'rounded-full' : 'rounded-3xl'
              )}
            >
              {/* Composition Grid */}
              {showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              )}
            </div>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
            <p className="bg-black/60 backdrop-blur-xl text-white/70 text-[9px] font-black py-2 px-4 rounded-full uppercase tracking-[0.2em] border border-white/10 shadow-2xl transition-opacity group-active:opacity-0">
              Déplacez • Zoomez • Pivotez
            </p>
          </div>
        </div>

        <div className="space-y-6 px-2">
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
            <ZoomOut size={16} className="text-white/20" />
            <Slider
              value={[zoom]}
              min={0.5}
              max={4}
              step={0.01}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn size={16} className="text-white/20" />
            
            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <button 
              onClick={handleRotate}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <RotateCw size={18} />
            </button>
            
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-2xl transition-colors",
                showGrid ? "bg-white text-black" : "bg-white/5 text-white/40"
              )}
            >
              <Grid size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              className="flex-1 h-16 rounded-[28px] bg-white/5 hover:bg-white/10 text-white font-black transition-all border border-white/5 uppercase tracking-widest text-xs"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button 
              className="flex-1 h-16 rounded-[28px] font-black bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10 uppercase tracking-widest text-xs"
              onClick={handleCrop}
            >
              Terminer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
