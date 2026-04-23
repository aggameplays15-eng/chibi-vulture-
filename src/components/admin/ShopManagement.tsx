"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, X, Package, Tags, Palette, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
import ImageUploader, { type UploadedImage } from './ImageUploader';

// ─── Types ───────────────────────────────────────────────────
interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface ProductForm {
  name: string;
  price: string;
  category: string;
  stock: string;
  featured: boolean;
  description: string;
  // Champs conditionnels selon catégorie
  size?: string;
  color?: string;
  material?: string;
  format?: string;
  edition?: string;
}

const EMPTY_FORM: ProductForm = {
  name: '', price: '', category: '', stock: '',
  featured: false, description: '',
  size: '', color: '', material: '', format: '', edition: '',
};

// Champs extra selon le type de catégorie
const CATEGORY_FIELDS: Record<string, { label: string; key: keyof ProductForm; placeholder: string }[]> = {
  'Vêtements': [
    { label: 'Taille(s)', key: 'size', placeholder: 'Ex: XS, S, M, L, XL' },
    { label: 'Couleur(s)', key: 'color', placeholder: 'Ex: Noir, Blanc, Rose' },
    { label: 'Matière', key: 'material', placeholder: 'Ex: 100% Coton' },
  ],
  'Accessoires': [
    { label: 'Couleur(s)', key: 'color', placeholder: 'Ex: Doré, Argenté' },
    { label: 'Matière', key: 'material', placeholder: 'Ex: Acier inoxydable' },
  ],
  'Art Digital': [
    { label: 'Format', key: 'format', placeholder: 'Ex: PNG 4K, SVG, PDF' },
    { label: 'Édition', key: 'edition', placeholder: 'Ex: Édition limitée 50 ex.' },
  ],
  'Livres': [
    { label: 'Format', key: 'format', placeholder: 'Ex: A5, A4, Broché' },
    { label: 'Édition', key: 'edition', placeholder: 'Ex: 1ère édition' },
  ],
  'Limited': [
    { label: 'Édition', key: 'edition', placeholder: 'Ex: 1/100' },
    { label: 'Format', key: 'format', placeholder: 'Ex: Boîte collector' },
  ],
  'Merch': [
    { label: 'Couleur(s)', key: 'color', placeholder: 'Ex: Multicolore' },
    { label: 'Taille(s)', key: 'size', placeholder: 'Ex: Unique' },
  ],
};

// ─── Composant principal ──────────────────────────────────────
const ShopManagement = () => {
  const { products, deleteProduct, addProduct, updateProduct, primaryColor } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm | 'images', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [filterCat, setFilterCat] = useState('Tous');

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const cats = await apiService.getProductCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setCategories([]);
    }
  };

  const extraFields = CATEGORY_FIELDS[form.category] || [];

  const set = (key: keyof ProductForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Partial<Record<keyof ProductForm | 'images', string>> = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) e.price = 'Prix invalide (> 0)';
    if (!form.category.trim()) e.category = 'Catégorie requise';
    const stockNum = Number(form.stock);
    if (form.stock === '' || isNaN(stockNum) || stockNum < 0) e.stock = 'Stock invalide (≥ 0)';
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
      description: (p as any).description || '',
      size: '', color: '', material: '', format: '', edition: '',
    });
    setUploadedImages([]);
    setErrors({});
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    // Construire la description enrichie avec les champs conditionnels
    const extras = extraFields
      .filter(f => form[f.key]?.toString().trim())
      .map(f => `${f.label}: ${form[f.key]}`)
      .join(' | ');

    const fullDescription = [form.description.trim(), extras].filter(Boolean).join('\n');

    const primaryImage = uploadedImages[0]?.dataUrl
      || (editId ? undefined : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(form.name)}`);

    const productData: any = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      stock: Number(form.stock),
      featured: form.featured,
      description: fullDescription || undefined,
    };
    if (primaryImage) productData.image = primaryImage;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    deleteProduct(id);
    showSuccess(`${name} supprimé.`);
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
      });
      showSuccess(`Catégorie "${newCatName}" créée !`);
      setNewCatName('');
      loadCategories();
    } catch {
      showError('Erreur lors de la création de la catégorie');
    } finally {
      setIsAddingCat(false);
    }
  };

  const filteredProducts = filterCat === 'Tous'
    ? products
    : products.filter(p => p.category === filterCat);

  const allCats = ['Tous', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Inventaire</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{products.length} produits</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCatManager(true)} variant="outline"
            className="rounded-2xl gap-2 border-pink-200 text-pink-600 hover:bg-pink-50 text-xs h-9">
            <Tags size={15} /> Catégories
          </Button>
          <Button onClick={openAdd} className="rounded-2xl gap-2 text-white text-xs h-9"
            style={{ backgroundColor: primaryColor }}>
            <Plus size={15} /> Nouveau
          </Button>
        </div>
      </div>

      {/* Filtre par catégorie */}
      {allCats.length > 2 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {allCats.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${
                filterCat === cat ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              style={filterCat === cat ? { backgroundColor: primaryColor } : {}}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <Card className="border border-pink-100 rounded-[28px] shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor + '20' }}>
                  <Package size={16} style={{ color: primaryColor }} />
                </div>
                <h4 className="font-black text-gray-900">
                  {editId ? 'Modifier le produit' : 'Nouveau produit'}
                </h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-xl hover:bg-gray-100">
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Images */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Images du produit {!editId && <span className="text-rose-400">*</span>}
                </Label>
                <ImageUploader images={uploadedImages} onChange={setUploadedImages} maxImages={6} />
                {errors.images && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle size={10} /> {errors.images}
                  </p>
                )}
              </div>

              {/* Nom + Prix */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Nom <span className="text-rose-400">*</span>
                  </Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Ex: T-Shirt Chibi" maxLength={200}
                    className={`h-11 rounded-xl text-sm ${errors.name ? 'border-rose-400' : 'border-gray-200'}`} />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Prix (GNF) <span className="text-rose-400">*</span>
                  </Label>
                  <Input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                    placeholder="Ex: 250000" min="0"
                    className={`h-11 rounded-xl text-sm ${errors.price ? 'border-rose-400' : 'border-gray-200'}`} />
                  {errors.price && <p className="text-[10px] text-rose-500 font-bold">{errors.price}</p>}
                </div>
              </div>

              {/* Catégorie + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Catégorie <span className="text-rose-400">*</span>
                  </Label>
                  <div className="relative">
                    <select value={form.category}
                      onChange={e => { set('category', e.target.value); setErrors(prev => ({ ...prev, category: undefined })); }}
                      className={`h-11 rounded-xl border text-sm px-3 bg-white w-full appearance-none pr-8 ${
                        errors.category ? 'border-rose-400' : 'border-gray-200'
                      }`}>
                      <option value="">Sélectionner...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.category && <p className="text-[10px] text-rose-500 font-bold">{errors.category}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Stock <span className="text-rose-400">*</span>
                  </Label>
                  <Input type="number" value={form.stock} onChange={e => set('stock', e.target.value)}
                    placeholder="Ex: 10" min="0"
                    className={`h-11 rounded-xl text-sm ${errors.stock ? 'border-rose-400' : 'border-gray-200'}`} />
                  {errors.stock && <p className="text-[10px] text-rose-500 font-bold">{errors.stock}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Décris ton produit..."
                  className="rounded-xl border-gray-200 text-sm min-h-[80px] resize-none" maxLength={500} />
              </div>

              {/* Champs conditionnels selon catégorie */}
              {extraFields.length > 0 && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px]"
                      style={{ backgroundColor: primaryColor }}>✦</span>
                    Détails {form.category}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {extraFields.map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{f.label}</Label>
                        <Input value={(form[f.key] as string) || ''} onChange={e => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="h-10 rounded-xl border-gray-200 text-sm bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* En vedette */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-black text-gray-800">Produit en vedette ⭐</p>
                  <p className="text-[10px] text-gray-400 font-bold">Affiché en priorité dans la boutique</p>
                </div>
                <Switch checked={form.featured} onCheckedChange={v => set('featured', v)} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl h-11">
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}
                  className="flex-1 rounded-xl h-11 text-white font-black"
                  style={{ backgroundColor: primaryColor }}>
                  {isSubmitting ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Ajouter le produit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste produits */}
      <div className="space-y-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-none shadow-sm rounded-[28px] overflow-hidden group hover:border-pink-100 border transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-gray-900 text-sm">{product.name}</p>
                    {product.featured && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{product.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black" style={{ color: primaryColor }}>
                      {Number(product.price).toLocaleString('fr-FR')} GNF
                    </span>
                    <Badge className="text-[8px] font-black uppercase px-2 py-0 h-4 border-none bg-emerald-50 text-emerald-600">
                      {product.stock} en stock
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(product)}
                  className="h-9 w-9 rounded-xl text-gray-400 hover:bg-pink-50 hover:text-pink-500">
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)}
                  className="h-9 w-9 rounded-xl text-gray-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Aucun produit{filterCat !== 'Tous' ? ` dans "${filterCat}"` : ''}</p>
            <p className="text-xs mt-1">Clique sur "Nouveau" pour commencer</p>
          </div>
        )}
      </div>

      {/* Modal catégories */}
      {showCatManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[32px] overflow-hidden border-none shadow-2xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Tags size={18} className="text-pink-600" />
                  </div>
                  <h4 className="font-black text-gray-900">Catégories</h4>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCatManager(false)} className="rounded-xl">
                  <X size={20} />
                </Button>
              </div>

              <div className="flex gap-2 mb-5">
                <Input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nouvelle catégorie..."
                  className="rounded-xl h-11 border-pink-100"
                  onKeyDown={e => e.key === 'Enter' && !isAddingCat && handleAddCategory()} />
                <Button onClick={handleAddCategory} disabled={!newCatName.trim() || isAddingCat}
                  className="rounded-xl h-11 text-white font-black px-4"
                  style={{ backgroundColor: primaryColor }}>
                  {isAddingCat ? '...' : <Plus size={20} />}
                </Button>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
                      style={{ backgroundColor: cat.color || primaryColor }}>
                      {cat.name[0]}
                    </div>
                    <span className="font-bold text-gray-800 text-sm flex-1">{cat.name}</span>
                    <span className="text-[10px] font-black text-gray-300 uppercase">Active</span>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-center py-4 text-gray-400 text-xs font-bold">Aucune catégorie</p>
                )}
              </div>

              <Button onClick={() => setShowCatManager(false)}
                className="w-full mt-5 rounded-2xl h-11 font-black" variant="secondary">
                Fermer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;
