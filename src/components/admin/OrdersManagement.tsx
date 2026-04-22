"use client";

import React, { useState, useMemo } from 'react';
import { Package, Search, ChevronDown, Clock, Truck, CheckCircle2, XCircle, Eye, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  'En attente':  { color: 'bg-yellow-50 text-yellow-700', icon: Clock,       dot: 'bg-yellow-400' },
  'Préparation': { color: 'bg-blue-50 text-blue-700',     icon: Package,     dot: 'bg-blue-400'   },
  'Livré':       { color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2, dot: 'bg-emerald-400' },
  'Annulé':      { color: 'bg-red-50 text-red-700',       icon: XCircle,     dot: 'bg-red-400'    },
} as const;

type OrderStatus = keyof typeof STATUS_CONFIG;

const OrdersManagement = () => {
  const { orders, primaryColor } = useApp();
  const safeOrders = Array.isArray(orders) ? orders : [];

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'Tous'>('Tous');
  const [selectedOrder, setSelectedOrder] = useState<typeof safeOrders[0] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return safeOrders.filter(o => {
      const matchSearch = !search ||
        o.customer?.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'Tous' || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [safeOrders, search, filterStatus]);

  const counts = useMemo(() => ({
    'En attente':  safeOrders.filter(o => o.status === 'En attente').length,
    'Préparation': safeOrders.filter(o => o.status === 'Préparation').length,
    'Livré':       safeOrders.filter(o => o.status === 'Livré').length,
  }), [safeOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await apiService.updateDeliveryTracking({
        order_id: Number(orderId),
        status: newStatus,
        description: `Statut mis à jour: ${newStatus}`,
      });
      showSuccess(`Commande mise à jour: ${newStatus}`);
    } catch {
      showError('Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRevenue = safeOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Commandes</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{safeOrders.length} commandes · {(totalRevenue / 1000000).toFixed(1)}M GNF</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(counts) as [OrderStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? 'Tous' : status)}
              className={`p-3 rounded-2xl text-left transition-all border-2 ${
                filterStatus === status ? 'border-purple-200 bg-purple-50' : 'border-transparent bg-white shadow-sm'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${cfg.dot} mb-2`} />
              <p className="text-lg font-black text-gray-900">{count}</p>
              <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{status}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par client ou ID..."
          className="pl-10 h-12 rounded-2xl border-gray-100 bg-white font-medium text-sm"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG['En attente'];
          const StatusIcon = cfg.icon;
          return (
            <div key={order.id} className="bg-white p-4 rounded-[28px] border border-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-50 p-2.5 rounded-2xl">
                    <Package size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{order.customer}</p>
                    <p className="text-[10px] text-gray-400 font-bold">#{String(order.id).slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{(order.total / 1000).toFixed(0)}K GNF</p>
                  <p className="text-[10px] text-gray-400 font-bold">{order.date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={`${cfg.color} border-none text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1`}>
                  <StatusIcon size={10} />
                  {order.status}
                </Badge>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl hover:bg-gray-50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={14} className="text-gray-400" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={updatingId === String(order.id)}
                        className="h-8 rounded-xl text-[10px] font-black gap-1 bg-gray-50 hover:bg-gray-100"
                      >
                        Statut <ChevronDown size={12} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[20px] border-gray-100 p-2 shadow-xl">
                      {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(s => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusUpdate(String(order.id), s)}
                          className={`gap-2 font-bold text-xs rounded-xl p-3 cursor-pointer ${order.status === s ? 'bg-gray-50' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <Package size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm font-bold text-gray-400">Aucune commande trouvée.</p>
          </div>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">
              Commande #{selectedOrder && String(selectedOrder.id).slice(-8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Client</span>
                  <span className="font-black">{selectedOrder.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Total</span>
                  <span className="font-black text-emerald-600">{(selectedOrder.total / 1000).toFixed(0)}K GNF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Date</span>
                  <span className="font-black">{selectedOrder.date}</span>
                </div>
                {selectedOrder.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-bold">Téléphone</span>
                    <span className="font-black">{selectedOrder.phone}</span>
                  </div>
                )}
                {selectedOrder.shipping_address && (
                  <div className="flex justify-between text-sm gap-4">
                    <span className="text-gray-500 font-bold flex items-center gap-1"><MapPin size={12} />Adresse</span>
                    <span className="font-black text-right text-xs">{selectedOrder.shipping_address}</span>
                  </div>
                )}
              </div>

              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider px-1">Articles</p>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                      <span className="text-sm font-bold text-gray-800">{item.name}</span>
                      <span className="text-xs font-black text-gray-500">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
