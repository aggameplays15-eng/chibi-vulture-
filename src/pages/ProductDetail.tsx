"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, ShoppingCart, Heart, Share2, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useApp } from '@/context/AppContext';
import { showSuccess } from "@/utils/toast";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, primaryColor, favoriteProducts, toggleFavoriteProduct } = useApp();
  const [selectedSize, setSelectedSize] = useState('M');

  const product = products.find(p => p.id === Number(id));
  const isFav = favoriteProducts.includes(Number(id));

  if (!product) {
    return (
      <MainLayout>
        <div className="p-20 text-center space-y-4">
          <p className="text-gray-400 font-bold">Produit introuvable.</p>
          <Button onClick={() => navigate('/shop')} style={{ backgroundColor: primaryColor }}>Retour à la boutique</Button>
        </div>
      </MainLayout>
    );
  }

  const handleAddToCart = () => {
    addToCart({ ...product, size: selectedSize });
    showSuccess("Produit ajouté au panier ! 🛒");
  };

  const handleFavorite = () => {
    toggleFavoriteProduct(product.id);
    showSuccess(isFav ? "Retiré des favoris" : "Ajouté aux favoris ! ❤️");
  };

  return (
    <MainLayout>
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full aspect-[4/5] object-cover"
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between">
          <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none">
              <Share2 size={20} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleFavorite}
              className={`rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-none transition-colors ${isFav ? 'text-red-500' : 'text-gray-400'}`}
            >
              <Heart size={20} fill={isFav ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 -mt-8 bg-white rounded-t-[40px] relative z-10">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-black text-gray-800">{product.name}</h1>
            <span className="text-xl font-black" style={{ color: primaryColor }}>{product.price.toLocaleString()} GNF</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <span className="text-xs text-gray-400 font-bold">(48 avis)</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Taille</p>
          <div className="flex gap-3">
            {['S', 'M', 'L', 'XL'].map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-12 h-12 rounded-2xl font-bold transition-all border-2 ${
                  selectedSize === size 
                    ? 'text-white scale-110 shadow-lg' 
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
                style={{ 
                  backgroundColor: selectedSize === size ? primaryColor : 'transparent',
                  borderColor: selectedSize === size ? primaryColor : undefined
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            Un produit exclusif de la collection Chibi Vulture. Qualité premium garantie pour tous nos membres de la communauté. ✨
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleAddToCart}
            className="flex-1 h-14 rounded-2xl text-lg font-black shadow-lg flex gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart size={20} />
            AJOUTER AU PANIER
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;