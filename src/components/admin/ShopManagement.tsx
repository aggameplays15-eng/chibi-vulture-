"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, X, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';
import { apiService } from '@/services/api';
import ImageUploader, { type UploadedImage } from './ImageUploader';

interface ProductForm {
  name: string;
  price: string;
  category: string;
  stock: string;
  featured: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  price: '',
  category: '',
  stock: '',
  featured: false,
};

const ShopManagement = () => {
  const { products, deleteProduct, addProduct, primaryColor } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Partial<ProductForm & { images: string }>>({});
  const [categories, setCategories] = useState<Array<{ id: number; name: string; color: string; icon: string }>>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await apiService.getProductCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const validate = () => {
    const e: Partial<ProductForm & { images: string }> = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Prix invalide';
    if (!form.category.trim()) e.category = 'Catégorie requise';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) e.stock = 'Stock invalide';
    if (uploadedImages.length === 0 && !editId) e.images = 'Au moins une image requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setUploadedImages([]);
    setErrors({});
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p: typeof products[0]) => {
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category,
      stock: String(p.stock),
      featured: p.featured,
    });
    setUploadedImages([]);
    setErrors({});
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Use primary (first) image dataUrl, fallback to placeholder
    const primaryImage = uploadedImages[0]?.dataUrl
      || `https://api.dicebear.com/7.x/shapes/svg?seed=${form.name}`;

    const productData = {
      name: form.name.trim(),
      price: Number(form.price),
      image: primaryImage,
      category: form.category.trim(),
      stock: Number(form.stock),
      featured: form.featured,
    };

    try {
      if (editId) {
        await apiService.updateUser({ id: editId, ...productData } as Parameters<typeof apiService.updateUser>[0]);
      } else {
        await apiService.addProduct(productData);
      }
      addProduct(productData);
      showSuccess(editId ? `${form.name} mis à jour ✅` : `${form.name} ajouté à la boutique ✅`);
    } catch {
      addProduct(productData);
      showSuccess(editId ? `${form.name} mis à jour (local) ✅` : `${form.name} ajouté (local) ✅`);
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setUploadedImages([]);
    setEditId(null);
  };

  const handleDelete = (id: number, name: string) => {
    deleteProduct(id);
    showSuccess(`${name} supprimé de la boutique.`);
  };

  const field = (key: keyof ProductForm, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</Label>
      <Input
        type={type}
        value={form[key] as string}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`h-11 rounded-xl border ${errors[key] ? 'border-rose-400' : 'border-gray-200'} text-sm`}
      />
      {errors[key] && <p className="text-[10px] text-rose-500 font-bold">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Inventaire Pro</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{products.length} produits actifs</p>
        </div>
        <Button
          onClick={openAdd}
          className="rounded-2xl gap-2 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={18} /> Nouveau Produit
        </Button>
      </div>

      {/* Formulaire ajout/édition */}
      {showForm && (
        <Card className="border border-pink-100 rounded-[28px] shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                  <Package size={16} style={{ color: primaryColor }} />
                </div>
                <h4 className="font-black text-gray-900">
                  {editId ? 'Modifier le produit' : 'Nouveau produit'}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-xl hover:bg-gray-100"
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('name', 'Nom du produit', 'text', 'Ex: T-Shirt Chibi')}
                {field('price', 'Prix (GNF)', 'number', 'Ex: 250000')}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Catégorie</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className={`h-11 rounded-xl border ${errors.category ? 'border-rose-400' : 'border-gray-200'} text-sm px-3 bg-white w-full`}
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-[10px] text-rose-500 font-bold">{errors.category}</p>}
                </div>
                {field('stock', 'Stock', 'number', 'Ex: 10')}
              </div>

              {/* Image uploader */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Images du produit
                </Label>
                <ImageUploader
                  images={uploadedImages}
                  onChange={setUploadedImages}
                  maxImages={6}
                />
                {errors.images && <p className="text-[10px] text-rose-500 font-bold">{errors.images}</p>}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-black text-gray-800">Produit en vedette</p>
                  <p className="text-[10px] text-gray-400 font-bold">Affiché en priorité dans la boutique</p>
                </div>
                <Switch
                  checked={form.featured}
                  onCheckedChange={v => setForm(prev => ({ ...prev, featured: v }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl h-11"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl h-11 text-white font-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editId ? 'Mettre à jour' : 'Ajouter le produit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des produits */}
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="border-none shadow-sm rounded-[28px] overflow-hidden group hover:border-pink-100 border transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-gray-900">{product.name}</p>
                    {product.featured && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{product.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black" style={{ color: primaryColor }}>
                      {product.price.toLocaleString()} GNF
                    </span>
                    <Badge className="text-[8px] font-black uppercase px-2 py-0.5 border-none bg-emerald-100 text-emerald-600">
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(product)}
                  data-testid="edit-product"
                  className="h-10 w-10 rounded-xl text-gray-400 hover:bg-pink-50 hover:text-pink-500"
                >
                  <Edit2 size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id, product.name)}
                  data-testid="delete-product"
                  className="h-10 w-10 rounded-xl text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Aucun produit dans la boutique</p>
            <p className="text-xs mt-1">Cliquez sur "Nouveau Produit" pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopManagement;
