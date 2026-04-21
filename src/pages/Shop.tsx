"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ShoppingCart, Search, Filter, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { showSuccess } from '@/utils/toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/api';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Shop = () => {
  const navigate = useNavigate();
  const { cart, addToCart, primaryColor, products } = useApp();
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    apiService.getProductCategories()
      .then((cats: { name: string }[]) => {
        if (cats?.length) setDbCategories(cats.map((c: { name: string }) => c.name));
      })
      .catch(() => {})
      .finally(() => setIsLoadingProducts(false));
  }, []);

  // Catégories dynamiques : celles de la DB + celles utilisées dans les produits existants
  const categories = useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean);
    const all = [...new Set([...dbCategories, ...fromProducts])].sort();
    return ["Tous", ...all];
  }, [products, dbCategories]);

  const filteredProducts = products
    .filter(p =>
      (activeCategory === "Tous" || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  return (
    <MainLayout>
      <header className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Collection</p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Boutique</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-12 h-12 rounded-2xl bg-white shadow-sm relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ backgroundColor: primaryColor }}>
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus-visible:ring-2" 
              style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              placeholder="Rechercher un produit..." 
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white shadow-sm text-gray-400">
                <ArrowUpDown size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2">
              <DropdownMenuItem onClick={() => setSortBy('default')} className={cn("rounded-xl font-bold text-xs p-3", sortBy === 'default' && 'text-pink-500')}>Par défaut</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-asc')} className={cn("rounded-xl font-bold text-xs p-3", sortBy === 'price-asc' && 'text-pink-500')}>Prix croissant ↑</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-desc')} className={cn("rounded-xl font-bold text-xs p-3", sortBy === 'price-desc' && 'text-pink-500')}>Prix décroissant ↓</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-premium",
                activeCategory === cat 
                  ? "text-white shadow-lg" 
                  : "bg-white text-gray-400 hover:bg-gray-50"
              )}
              style={{ backgroundColor: activeCategory === cat ? primaryColor : undefined }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 grid grid-cols-2 gap-4 pb-32">
        {isLoadingProducts && products.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] overflow-hidden border border-gray-50">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-2 w-16 rounded-full" />
                  <Skeleton className="h-4 w-full rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              </div>
            ))
          : filteredProducts.map((product, index) => (
          <motion.div 
            key={product.id} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/product/${product.id}`)}
            className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50 group cursor-pointer hover:shadow-xl transition-premium"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-50">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute top-3 right-3">
                <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-sm">
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{product.category}</p>
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-black text-sm" style={{ color: primaryColor }}>{product.price.toLocaleString()} GNF</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                    showSuccess("Ajouté au panier ! 🛒");
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </MainLayout>
  );
};

export default Shop;