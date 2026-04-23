"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, X, Package, Tags, Palette, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
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
  const { products, deleteProduct, addProduct, updateProduct, primaryColor } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Partial<ProductForm & { images: string }>>({});
  const [categories, setCategories] = useState<Array<{ id: number; name: string; color: string; icon: string }>>([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await apiService.getProductCategories();
      setCategories(cats || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      await apiService.createProductCategory({
        name: newCatName.trim(),
        description: '',
        icon: 'Tag',
        color: primaryColor,
        sort_order: categories.length + 1
      });
      showSuccess(`Catégorie "${newCatName}" créée !`);
      setNewCatName('');
      loadCategories();
    } catch (error) {
      showError('Erreur lors de la création de la catégorie');
    } finally {
      setIsAddingCat(false);
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
        await updateProduct(editId, productData);
        showSuccess(`${form.name} mis à jour ✅`);
      } else {
        await addProduct(productData);
        showSuccess(`${form.name} ajouté à la boutique ✅`);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setUploadedImages([]);
      setEditId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      showError(`Échec: ${msg}`);
    }
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
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCatManager(true)}
            variant="outline"
            className="rounded-2xl gap-2 border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Tags size={18} /> Catégories
          </Button>
          <Button
            onClick={openAdd}
            className="rounded-2xl gap-2 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={18} /> Nouveau Produit
          </Button>
        </div>
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
      {/* Gestion des Catégories Modal */}
      {showCatManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[32px] overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Tags size={18} className="text-pink-600" />
                  </div>
                  <h4 className="font-black text-gray-900">Gérer les catégories</h4>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCatManager(false)} className="rounded-xl">
                  <X size={20} />
                </Button>
              </div>

              {/* Add category form */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nom de la catégorie..."
                  className="rounded-xl h-11 border-pink-100 focus-visible:ring-pink-200"
                  onKeyDown={e => e.key === 'Enter' && !isAddingCat && handleAddCategory()}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim() || isAddingCat}
                  className="rounded-xl h-11 text-white font-black px-4"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isAddingCat ? '...' : <Plus size={20} />}
                </Button>
              </div>

              {/* Categories list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cat.color || primaryColor }}>
                        <Palette size={14} />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
                    </div>
                    {/* Placeholder for delete - usually we don't want to delete active categories easily */}
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mr-2 group-hover:text-pink-300 transition-colors">Active</p>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center py-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Chargement...</p>
                )}
              </div>

              <Button
                onClick={() => setShowCatManager(false)}
                className="w-full mt-6 rounded-2xl h-12 font-black tracking-widest"
                variant="secondary"
              >
                FERMER
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default ShopManagement;
