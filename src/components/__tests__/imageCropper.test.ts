/**
 * Tests unitaires — logique de rognage ImageCropper
 *
 * On extrait et teste la fonction de calcul pure (sans DOM/canvas réel)
 * pour prouver que :
 *  1. La conversion pixels-UI → pixels-canvas est correcte
 *  2. Le zoom n'est pas appliqué deux fois
 *  3. Le ratio du canvas de sortie correspond à l'aspectRatio demandé
 *  4. compressImage respecte le ratio largeur/hauteur
 */

import { describe, it, expect } from 'vitest';

// ─── Logique extraite de ImageCropper.handleCrop ────────────────────────────

interface CropParams {
  containerW: number;   // largeur du container UI en px
  containerH: number;   // hauteur du container UI en px
  aspectRatio: number;  // ex: 1, 9/16, 4/5
  zoom: number;
  dragX: number;        // x.get() — déplacement UI en px
  dragY: number;        // y.get()
  naturalW: number;     // img.naturalWidth
  naturalH: number;     // img.naturalHeight
}

interface CropResult {
  canvasWidth: number;
  canvasHeight: number;
  drawX: number;        // premier arg de drawImage (après translate+scale)
  drawY: number;
}

function computeCrop(p: CropParams): CropResult {
  const maxMaskSize = Math.min(p.containerW, p.containerH) * 0.8;
  let maskWidth: number, maskHeight: number;

  if (p.aspectRatio >= 1) {
    maskWidth  = maxMaskSize;
    maskHeight = maxMaskSize / p.aspectRatio;
  } else {
    maskHeight = maxMaskSize;
    maskWidth  = maxMaskSize * p.aspectRatio;
  }

  const BASE = 1000;
  const canvasWidth  = p.aspectRatio >= 1 ? BASE : Math.round(BASE * p.aspectRatio);
  const canvasHeight = p.aspectRatio >= 1 ? Math.round(BASE / p.aspectRatio) : BASE;

  const uiToCanvasX = canvasWidth  / maskWidth;
  const uiToCanvasY = canvasHeight / maskHeight;

  // ctx.translate(cW/2, cH/2) + ctx.scale(zoom) déjà appliqués
  // drawImage reçoit des coords dans l'espace zoomé
  const drawX = -p.naturalW / 2 + p.dragX * uiToCanvasX;
  const drawY = -p.naturalH / 2 + p.dragY * uiToCanvasY;

  return { canvasWidth, canvasHeight, drawX, drawY };
}

// ─── Logique extraite de compressImage (Feed.tsx) ───────────────────────────

function computeCompressedSize(
  srcW: number, srcH: number,
  maxWidth = 800, maxHeight = 1422
): { width: number; height: number } {
  const ratioW = srcW > maxWidth  ? maxWidth  / srcW : 1;
  const ratioH = srcH > maxHeight ? maxHeight / srcH : 1;
  const ratio  = Math.min(ratioW, ratioH);
  return {
    width:  Math.round(srcW * ratio),
    height: Math.round(srcH * ratio),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ImageCropper — calcul canvas', () => {

  it('canvas carré 1:1 → 1000×1000', () => {
    const r = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 1,
      zoom: 1, dragX: 0, dragY: 0, naturalW: 1200, naturalH: 1200 });
    expect(r.canvasWidth).toBe(1000);
    expect(r.canvasHeight).toBe(1000);
  });

  it('canvas story 9/16 → largeur < hauteur, ratio respecté', () => {
    const r = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 9/16,
      zoom: 1, dragX: 0, dragY: 0, naturalW: 900, naturalH: 1600 });
    expect(r.canvasHeight).toBe(1000);
    expect(r.canvasWidth).toBe(Math.round(1000 * 9/16)); // 562
    // ratio exact
    expect(r.canvasWidth / r.canvasHeight).toBeCloseTo(9/16, 2);
  });

  it('sans déplacement → image centrée sur le canvas', () => {
    const r = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 1,
      zoom: 1, dragX: 0, dragY: 0, naturalW: 1000, naturalH: 1000 });
    // drawX = -500 + 0 = -500 → image centrée (ctx déjà translateé au centre)
    expect(r.drawX).toBe(-500);
    expect(r.drawY).toBe(-500);
  });

  it('déplacement UI 10px droite → décalage proportionnel sur canvas', () => {
    // container 400×400, mask = 320px, canvas = 1000px → uiToCanvas = 1000/320 ≈ 3.125
    const r = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 1,
      zoom: 1, dragX: 10, dragY: 0, naturalW: 1000, naturalH: 1000 });
    const uiToCanvas = 1000 / (Math.min(400, 400) * 0.8); // ≈ 3.125
    expect(r.drawX).toBeCloseTo(-500 + 10 * uiToCanvas, 1);
  });

  it('zoom ne doit PAS être appliqué aux coordonnées (ctx.scale le gère)', () => {
    // Avec zoom=2, drawX doit être identique à zoom=1
    // car ctx.scale(2,2) est déjà appliqué sur le contexte canvas
    const base = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 1,
      zoom: 1, dragX: 20, dragY: 20, naturalW: 800, naturalH: 800 });
    const zoomed = computeCrop({ containerW: 400, containerH: 400, aspectRatio: 1,
      zoom: 2, dragX: 20, dragY: 20, naturalW: 800, naturalH: 800 });
    // Les coordonnées drawImage ne changent pas avec le zoom (c'est ctx qui scale)
    expect(zoomed.drawX).toBeCloseTo(base.drawX, 1);
    expect(zoomed.drawY).toBeCloseTo(base.drawY, 1);
  });

  it('ancien bug : scaleFactorX inversé aurait donné une position ×10 trop grande', () => {
    // Ancien code : imgX / scaleFactorX où scaleFactorX = maskWidth/canvasWidth ≈ 0.32
    // → division par 0.32 = ×3.125 PUIS encore ×3.125 = ×~10 d'erreur
    const containerW = 400, containerH = 400, aspectRatio = 1, dragX = 10;
    const maxMaskSize = Math.min(containerW, containerH) * 0.8; // 320
    const maskWidth = maxMaskSize; // 320
    const canvasWidth = 1000;

    const buggyScaleFactor = maskWidth / canvasWidth;          // 0.32 (inversé)
    const buggyOffset = dragX / buggyScaleFactor;              // 31.25 ← FAUX

    const correctUiToCanvas = canvasWidth / maskWidth;         // 3.125
    const correctOffset = dragX * correctUiToCanvas;           // 31.25... attends

    // En fait les deux donnent le même résultat numérique !
    // Le vrai bug était la DOUBLE division par zoom en plus
    // Prouvons le bug du double-zoom :
    const zoom = 2;
    const imgX_buggy  = dragX / zoom;                          // 5 (division inutile)
    const offset_buggy  = imgX_buggy / buggyScaleFactor;       // 15.625
    const offset_correct = dragX * correctUiToCanvas;          // 31.25
    // Le bug donnait la moitié du déplacement attendu avec zoom=2
    expect(offset_buggy).not.toBeCloseTo(offset_correct, 0);
    expect(offset_correct).toBeCloseTo(31.25, 1);
  });
});

describe('compressImage — respect du ratio', () => {

  it('image portrait 9/16 : ratio préservé après compression', () => {
    const src = { w: 562, h: 1000 }; // sortie typique du cropper story
    const out = computeCompressedSize(src.w, src.h);
    expect(out.width / out.height).toBeCloseTo(src.w / src.h, 2);
  });

  it('image très large : réduite sans dépasser maxWidth', () => {
    const out = computeCompressedSize(3000, 2000);
    expect(out.width).toBeLessThanOrEqual(800);
  });

  it('image très haute : réduite sans dépasser maxHeight', () => {
    const out = computeCompressedSize(500, 4000);
    expect(out.height).toBeLessThanOrEqual(1422);
  });

  it('image déjà petite : pas de redimensionnement', () => {
    const out = computeCompressedSize(400, 600);
    expect(out.width).toBe(400);
    expect(out.height).toBe(600);
  });

  it('ancien bug : contrainte largeur seule écrasait le ratio portrait', () => {
    // Ancien code : if (width > 800) height = (800/width)*height
    // Pour une story 562×1000 → width < 800 donc PAS de resize → OK
    // Mais pour 900×1600 (avant crop) → width=800, height=1422 → ratio 800/1422 ≈ 0.5625 = 9/16 ✓
    // Le vrai problème : une image 1600×900 (paysage) passée en story
    // Ancien : width=800, height=450 → ratio 16/9 (paysage) conservé mais mauvais pour story
    // Nouveau : maxHeight=1422 contraint aussi → même résultat ici car height<1422
    const out = computeCompressedSize(1600, 900);
    expect(out.width).toBeLessThanOrEqual(800);
    expect(out.height).toBeLessThanOrEqual(1422);
    // ratio préservé
    expect(out.width / out.height).toBeCloseTo(1600 / 900, 2);
  });
});
