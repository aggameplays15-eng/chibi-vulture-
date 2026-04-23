"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, ShoppingCart, Heart, Share2, Star, Package, Tag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { showSuccess } from "@/utils/toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, primaryColor, favoriteProducts, toggleFavoriteProduct } = useApp();

  const product = products.find(p => p.id === Number(id));
  const isFav = favoriteProducts.includes(Number(id));

  // Extraire les détails depuis la description (format "Taille: S, M | Couleur: Noir")
  const parseDetails = (desc: string) => {
    const lines = desc?.split('\n') || [];
    const details: { label: string; value: string }[] = [];
    const descLines: string[] = [];
    lines.forEach(line => {
      const match = line.match(/^(.+?):\s*(.+)$/);
      if (match && line.includes(' | ') === false && !line.startsWith('http')) {
        // Ligne de détail inline (ex: "Taille: S, M, L | Couleur: Noir")
      }
      // Séparer les paires clé: valeur séparées par |
      const parts = line.split(' | ');
      let isDetail = false;
      parts.forEach(part => {
        const m = part.match(/^(.+?):\s*(.+)$/);
        if (m) { details.push({ label: m[1].trim(), value: m[2].trim() }); isDetail = true; }
      });
      if (!isDetail && line.trim()) descLines.push(line.trim());
    });
    return { details, description: descLines.join('\n') };
  };

  const { details, description } = parseDetails((product as any)?.description || '');

  if (!product) {
    return (
      <MainLayout>
        <div className="p-20 text-center space-y-4">
          <Package size={48} className="mx-auto text-gray-200" />
          <p className="text-gray-400 font-bold">Produit introuvable.</p>
          <Button onClick={() => navigate('/shop')} className="rounded-2xl text-white" style={{ backgroundColor: primaryColor }}>
            Retour à la boutique
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image });
    showSuccess(`${product.name} ajouté au panier ! 🛒`);
  };

  const handleFavorite = () => {
    toggleFavoriteProduct(product.id);
    showSuccess(isFav ? "Retiré des favoris" : "Ajouté aux favoris ! ❤️");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      showSuccess('Lien copié ! 🔗');
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/shop');
    }
  };

  return (
    <MainLayout>
      <header className="p-4 flex items-center gap-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
          <ChevronLeft size={24} />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon"
            className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none"
            onClick={handleShare}>
            <Share2 size={20} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleFavorite}
            className={`rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none transition-colors ${isFav ? 'text-red-500' : 'text-gray-400'}`}>
            <Heart size={20} fill={isFav ? "currentColor" : "none"} />
          </Button>
        </div>
      </header>

      {/* Image hero */}
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full aspect-[4/5] object-cover" />

        {/* Stock badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-6 left-6">
            <Badge className="bg-orange-500 text-white font-black rounded-full px-3 py-1 text-xs shadow-lg">
              Plus que {product.stock} en stock !
            </Badge>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge className="bg-gray-800 text-white font-black rounded-full px-4 py-2 text-sm">
              Rupture de stock
            </Badge>
          </div>
        )}
      </div>

      {/* Fiche produit */}
      <div className="p-6 space-y-6 -mt-8 bg-white dark:bg-[hsl(224,20%,9%)] rounded-t-[40px] relative z-10">

        {/* Nom + Prix + Catégorie */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight flex-1">
              {product.name}
            </h1>
            <span className="text-xl font-black flex-shrink-0" style={{ color: primaryColor }}>
              {Number(product.price).toLocaleString('fr-FR')} GNF
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="text-[10px] font-black uppercase px-2 py-0.5 border-none bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full flex items-center gap-1">
              <Tag size={9} /> {product.category}
            </Badge>
            {product.featured && (
              <Badge className="text-[10px] font-black uppercase px-2 py-0.5 border-none bg-yellow-50 text-yellow-600 rounded-full flex items-center gap-1">
                <Star size={9} fill="currentColor" /> Vedette
              </Badge>
            )}
            <Badge className={`text-[10px] font-black uppercase px-2 py-0.5 border-none rounded-full ${
              product.stock > 5 ? 'bg-emerald-50 text-emerald-600' :
              product.stock > 0 ? 'bg-orange-50 text-orange-600' :
              'bg-red-50 text-red-500'
            }`}>
              {product.stock > 5 ? `${product.stock} en stock` :
               product.stock > 0 ? `${product.stock} restant(s)` : 'Rupture'}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Détails conditionnels (Taille, Couleur, Matière, etc.) */}
        {details.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Détails</p>
            <div className="grid grid-cols-2 gap-3">
              {details.map((d, i) => (
                <div key={i} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{d.label}</p>
                  <p className="text-sm font-black text-gray-800 dark:text-white">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton panier */}
        <div className="pt-2">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full h-14 rounded-2xl text-lg font-black shadow-lg flex gap-2 text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart size={20} />
            {product.stock === 0 ? 'RUPTURE DE STOCK' : 'AJOUTER AU PANIER'}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
