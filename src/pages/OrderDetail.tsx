"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Package, ChevronLeft, MapPin, Phone, Truck, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price_at_purchase: number;
  image?: string;
}

interface OrderDetail {
  id: number;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
  phone: string | null;
  items: OrderItem[];
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  'En attente':     { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock,        label: 'En attente' },
  'Préparation':    { color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Package,      label: 'En préparation' },
  'Expédié':        { color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck,        label: 'Expédié' },
  'Livré':          { color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle2, label: 'Livré' },
  'Annulé':         { color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle,      label: 'Annulé' },
  // Aliases pour compatibilité
  'En préparation': { color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Package,      label: 'En préparation' },
  'Expédiée':       { color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck,        label: 'Expédiée' },
  'Livrée':         { color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle2, label: 'Livrée' },
  'Annulée':        { color: 'text-red-600',    bg: 'bg-red-50',    icon: XCircle,      label: 'Annulée' },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { primaryColor } = useApp();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/orders');
    }
  };

  useEffect(() => {
    if (!id || isNaN(Number(id))) { setIsLoading(false); setError(true); return; }
    const token = localStorage.getItem('cv_token');
    fetch(`/api/orders?id=${Number(id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async r => {
        if (!r.ok) { setError(true); return; }
        const data = await r.json();
        if (data && !data.error) setOrder(data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const cfg = order ? (statusConfig[order.status] || statusConfig['En attente']) : null;

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-xl font-black text-gray-900">Commande #{id}</h1>
      </header>

      <div className="px-4 space-y-4 pb-24">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        )}

        {!isLoading && (error || !order) && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-bold">Commande introuvable.</p>
            <Button variant="ghost" onClick={() => navigate('/orders')} className="mt-4">Retour</Button>
          </div>
        )}

        {order && cfg && (
          <>
            {/* Statut */}
            <div className={`${cfg.bg} rounded-3xl p-5 flex items-center gap-4`}>
              <div className={`${cfg.color} p-3 bg-white rounded-2xl shadow-sm`}>
                <cfg.icon size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Statut</p>
                <p className={`font-black text-lg ${cfg.color}`}>{cfg.label}</p>
              </div>
            </div>

            {/* Infos livraison */}
            <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Livraison</p>
              {order.shipping_address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 font-medium">{order.shipping_address}</p>
                </div>
              )}
              {order.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700 font-medium">{order.phone}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Articles */}
            <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Articles</p>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-2xl object-cover bg-gray-50" />
                      )}
                      <div>
                        <p className="font-bold text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">×{item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-black text-sm" style={{ color: primaryColor }}>
                      {(item.price_at_purchase * item.quantity).toLocaleString()} GNF
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-50 mt-4 pt-4 flex justify-between items-center">
                <p className="font-black text-gray-900">Total</p>
                <p className="font-black text-lg" style={{ color: primaryColor }}>
                  {Number(order.total).toLocaleString()} GNF
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default OrderDetail;
