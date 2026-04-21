"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { MapPin, Truck, User, Phone, Mail, Navigation, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from "@/utils/toast";
import DeliveryMap from '@/components/checkout/DeliveryMap';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, primaryColor, deliveryZones, addOrder } = useApp();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.5092, -13.7122]);

  const selectedZone = deliveryZones.find(z => z.id === selectedZoneId);
  const deliveryPrice = selectedZone ? selectedZone.price : 0;
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + deliveryPrice;

  const handleFinalize = async () => {
    if (!firstName || !lastName || !phone || !selectedZoneId) {
      showError("Remplis les champs obligatoires !");
      return;
    }
    
    try {
      const orderId = await addOrder({
        customer: `${firstName} ${lastName}`,
        total: total,
        items: [...cart],
        phone,
        shipping_address: address || selectedZone?.label || '',
      });
      clearCart();
      showSuccess("Commande enregistrée ! ✨");
      navigate('/checkout-success', { state: { orderId } });
    } catch {
      showError("Erreur lors de la commande. Réessaie.");
    }
  };

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/cart')}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-black text-gray-800 uppercase">Finaliser</h1>
      </header>

      <div className="px-6 pb-32 space-y-8">
        <section className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className="rounded-2xl h-12" />
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="rounded-2xl h-12" />
          </div>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" className="rounded-2xl h-12" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-2xl h-12" />
        </section>

        <section className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm space-y-4">
          <Select onValueChange={setSelectedZoneId}>
            <SelectTrigger className="rounded-2xl h-12"><SelectValue placeholder="Zone de livraison" /></SelectTrigger>
            <SelectContent>
              {deliveryZones.map(z => <SelectItem key={z.id} value={z.id}>{z.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="aspect-square rounded-[32px] overflow-hidden border-4 border-gray-50">
            <DeliveryMap center={mapCenter} onLocationSelect={(lat, lng, addr) => setAddress(addr || `${lat}, ${lng}`)} />
          </div>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse précise" className="rounded-2xl h-12" />
        </section>

        <section className="bg-gray-900 text-white p-6 rounded-[32px] space-y-4">
          <div className="flex justify-between text-2xl font-black">
            <span>TOTAL</span>
            <span style={{ color: primaryColor }}>{total.toLocaleString()} GNF</span>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase">Paiement à la livraison</span>
            <CheckCircle2 size={20} style={{ color: primaryColor }} />
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl z-50 md:max-w-2xl md:mx-auto">
        <Button onClick={handleFinalize} className="w-full h-16 rounded-2xl text-lg font-black" style={{ backgroundColor: primaryColor }}>
          COMMANDER MAINTENANT
        </Button>
      </div>
    </MainLayout>
  );
};

export default Checkout;