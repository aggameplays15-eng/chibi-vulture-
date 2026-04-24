"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Package, ChevronLeft, ChevronRight, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  shipping_address: string | null;
}

const statusColor: Record<string, string> = {
  'En attente':     'bg-yellow-50 text-yellow-600',
  'Préparation':    'bg-blue-50 text-blue-600',
  'Expédié':        'bg-purple-50 text-purple-600',
  'Livré':          'bg-green-50 text-green-600',
  'Annulé':         'bg-red-50 text-red-600',
  // Aliases pour compatibilité
  'En préparation': 'bg-blue-50 text-blue-600',
  'Expédiée':       'bg-purple-50 text-purple-600',
  'Livrée':         'bg-green-50 text-green-600',
  'Annulée':        'bg-red-50 text-red-600',
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { primaryColor } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiService.getMyOrders()
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };

  return (
    <MainLayout>
      <header className="p-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleBack}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-black text-gray-900">MES COMMANDES</h1>
      </header>

      <div className="px-4 space-y-3 pb-24">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-4 space-y-3 border border-gray-50">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-40 rounded-full" />
          </div>
        ))}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <ShoppingBag size={48} className="mx-auto text-gray-200" />
            <p className="text-gray-400 font-bold">Aucune commande pour le moment.</p>
            <Button onClick={() => navigate('/shop')} className="rounded-2xl font-bold text-white" style={{ backgroundColor: primaryColor }}>
              Aller à la boutique
            </Button>
          </div>
        )}

        {orders.map(order => (
          <div
            key={order.id}
            className="bg-white rounded-3xl p-4 border border-gray-50 shadow-sm flex items-center justify-between cursor-pointer hover:border-pink-100 transition-colors"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <Package size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm">Commande #{order.id}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs font-black mt-1" style={{ color: primaryColor }}>
                  {Number(order.total).toLocaleString()} GNF
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] font-black border-none px-2 py-1 ${statusColor[order.status] || 'bg-gray-50 text-gray-500'}`}>
                {order.status}
              </Badge>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default MyOrders;
