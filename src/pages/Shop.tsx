"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ShoppingCart, Search, ArrowUpDown, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
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

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <MainLayout>
      <header className="p-6 space-y-5">
        {/* Title row */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={12} style={{ color: primaryColor }} className="animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Collection</p>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Boutique</h1>
          </div>
          <button
            className="relative w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors tap-scale"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart size={20} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[hsl(224,20%,7%)]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-13 rounded-2xl border-none bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-2 h-12"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="Rechercher..."
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 border-none">
                <ArrowUpDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 dark:bg-[hsl(224,20%,12%)] dark:border-white/10">
              {[
                { key: 'default', label: 'Par défaut' },
                { key: 'price-asc', label: 'Prix croissant ↑' },
                { key: 'price-desc', label: 'Prix décroissant ↓' },
              ].map(opt => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as typeof sortBy)}
                  className={cn("rounded-xl font-bold text-xs p-3 dark:text-gray-300 dark:hover:bg-white/5", sortBy === opt.key && 'font-black')}
                  style={{ color: sortBy === opt.key ? primaryColor : undefined }}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-premium whitespace-nowrap tap-scale",
                activeCategory === cat
                  ? "text-white shadow-lg"
                  : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
              style={{ backgroundColor: activeCategory === cat ? primaryColor : undefined }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Stats bar */}
      {!isLoadingProducts && filteredProducts.length > 0 && (
        <div className="px-6 mb-4 flex items-center gap-2">
          <TrendingUp size={12} className="text-gray-400 dark:text-gray-600" />
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
            {activeCategory !== 'Tous' ? ` · ${activeCategory}` : ''}
          </p>
        </div>
      )}

      {/* Product grid */}
      <div className="px-4 grid grid-cols-2 gap-3 pb-32">
        {isLoadingProducts && products.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[28px] overflow-hidden border border-gray-50 dark:border-white/5">
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.23, 1, 0.32, 1] }}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[28px] overflow-hidden border border-gray-50 dark:border-white/5 group cursor-pointer hover:shadow-xl dark:hover:shadow-black/30 transition-premium"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-white/5">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                  />
                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {index < 3 && (
                      <span
                        className="text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Nouveau
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-0.5">{product.category}</p>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 leading-tight">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base" style={{ color: primaryColor }}>
                      {product.price.toLocaleString()} <span className="text-xs font-bold opacity-70">GNF</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                        showSuccess("Ajouté au panier ! 🛒");
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[10px] font-black shadow-sm active:scale-90 transition-transform tap-scale"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ShoppingCart size={12} />
                      Ajouter
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
        }
      </div>

      {!isLoadingProducts && filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
            <ShoppingCart size={24} className="text-gray-300 dark:text-gray-700" />
          </div>
          <p className="text-gray-400 dark:text-gray-600 font-bold text-sm">Aucun produit trouvé</p>
        </div>
      )}
    </MainLayout>
  );
};

export default Shop;
