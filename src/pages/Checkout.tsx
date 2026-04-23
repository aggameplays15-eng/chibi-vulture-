"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, CheckCircle2, MapPin, Phone, User, Truck, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from "@/utils/toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, primaryColor, deliveryZones, addOrder, user } = useApp();

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
  const deliveryPrice = selectedZone?.price ?? 0;
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryPrice;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Rediriger si panier vide
  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="p-20 text-center space-y-4">
          <ShoppingBag size={48} className="mx-auto text-gray-200" />
          <p className="text-gray-400 font-bold">Ton panier est vide.</p>
          <Button onClick={() => navigate('/shop')} className="rounded-2xl text-white" style={{ backgroundColor: primaryColor }}>
            Aller à la boutique
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleFinalize = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showError("Remplis ton prénom et nom.");
      return;
    }
    if (!phone.trim()) {
      showError("Numéro de téléphone requis.");
      return;
    }
    if (!selectedZoneId) {
      showError("Sélectionne une zone de livraison.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = await addOrder({
        customer: `${firstName.trim()} ${lastName.trim()}`,
        total,
        items: [...cart],
        phone: phone.trim(),
        shipping_address: address.trim() || selectedZone?.label || '',
      });
      clearCart();
      showSuccess("Commande enregistrée ! ✨");
      navigate('/checkout-success', { state: { orderId } });
    } catch {
      showError("Erreur lors de la commande. Réessaie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/cart')}>
          <ChevronLeft size={24} />
        </Button>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase">Finaliser la commande</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {itemCount} article{itemCount > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <div className="px-6 pb-40 space-y-6">

        {/* Récap articles */}
        <section className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-[28px] border border-gray-50 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <ShoppingBag size={15} style={{ color: primaryColor }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Récapitulatif</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Qté : {item.quantity}</p>
                </div>
                <span className="text-sm font-black flex-shrink-0" style={{ color: primaryColor }}>
                  {(item.price * item.quantity).toLocaleString('fr-FR')} GNF
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Infos client */}
        <section className="bg-white dark:bg-[hsl(224,20%,10%)] p-5 rounded-[28px] border border-gray-50 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={15} style={{ color: primaryColor }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Informations</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-gray-400">Prénom *</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Mamadou" className="rounded-xl h-11 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-gray-400">Nom *</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Diallo" className="rounded-xl h-11 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
              <Phone size={10} /> Téléphone *
            </Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+224 6XX XXX XXX" type="tel"
              className="rounded-xl h-11 text-sm" />
          </div>
        </section>

        {/* Livraison */}
        <section className="bg-white dark:bg-[hsl(224,20%,10%)] p-5 rounded-[28px] border border-gray-50 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={15} style={{ color: primaryColor }} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Livraison</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-gray-400">Zone *</Label>
            <Select onValueChange={setSelectedZoneId}>
              <SelectTrigger className="rounded-xl h-11 text-sm">
                <SelectValue placeholder="Sélectionne ta zone..." />
              </SelectTrigger>
              <SelectContent>
                {deliveryZones.map(z => (
                  <SelectItem key={z.id} value={z.id}>
                    <span className="font-bold">{z.label}</span>
                    <span className="ml-2 text-gray-400 text-xs">— {z.price.toLocaleString('fr-FR')} GNF</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1">
              <MapPin size={10} /> Adresse précise
            </Label>
            <Input value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Quartier, rue, repère..."
              className="rounded-xl h-11 text-sm" />
          </div>
        </section>

        {/* Total */}
        <section className="bg-gray-900 dark:bg-black/40 text-white p-5 rounded-[28px] space-y-3">
          <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-widest">
            <span>Sous-total</span>
            <span>{subtotal.toLocaleString('fr-FR')} GNF</span>
          </div>
          {selectedZone && (
            <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-widest">
              <span>Livraison ({selectedZone.label})</span>
              <span>{deliveryPrice.toLocaleString('fr-FR')} GNF</span>
            </div>
          )}
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="font-black text-lg">TOTAL</span>
            <span className="text-2xl font-black" style={{ color: primaryColor }}>
              {total.toLocaleString('fr-FR')} GNF
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3 mt-1">
            <CheckCircle2 size={16} style={{ color: primaryColor }} />
            <span className="text-xs font-bold text-white/70">Paiement à la livraison</span>
          </div>
        </section>
      </div>

      {/* Bouton fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 dark:bg-[hsl(224,20%,9%)]/90 backdrop-blur-xl z-50 border-t border-gray-100 dark:border-white/5 md:max-w-2xl md:mx-auto">
        <Button onClick={handleFinalize} disabled={isSubmitting}
          className="w-full h-14 rounded-2xl text-white text-base font-black shadow-lg disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}>
          {isSubmitting ? 'Enregistrement...' : 'COMMANDER MAINTENANT'}
        </Button>
      </div>
    </MainLayout>
  );
};

export default Checkout;
