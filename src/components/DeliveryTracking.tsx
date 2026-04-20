"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';

interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

interface OrderTracking {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  currentStatus: 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

const DeliveryTracking = ({ orderId }: { orderId: string }) => {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { primaryColor } = useApp();

  const loadTracking = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getOrderTracking(orderId);
      setTracking({
        orderId: response.orderId,
        trackingNumber: response.trackingNumber,
        carrier: response.carrier,
        currentStatus: response.currentStatus,
        estimatedDelivery: response.estimatedDelivery,
        events: response.events,
      });
    } catch (error) {
      console.error('Failed to load tracking:', error);
      setTracking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTracking = async () => {
    setIsRefreshing(true);
    await loadTracking();
    setIsRefreshing(false);
    showSuccess('Tracking mis à jour');
  };

  useEffect(() => {
    loadTracking();
  }, [orderId]);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', label: 'En attente' },
    processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', label: 'En préparation' },
    shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Expédié' },
    in_transit: { icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-50', label: 'En transit' },
    delivered: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Livré' },
    cancelled: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Annulé' },
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return (
      <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400 font-bold">Aucune information de tracking disponible</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = statusConfig[tracking.currentStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${currentStatus.bg}`}>
                <StatusIcon className={currentStatus.color} size={20} />
              </div>
              <div>
                <p className="font-black text-gray-900">{currentStatus.label}</p>
                <p className="text-xs text-gray-400 font-bold">{tracking.carrier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] font-black uppercase px-2 py-0.5 border-none" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                {tracking.trackingNumber}
              </Badge>
              {tracking.estimatedDelivery && (
                <p className="text-xs text-gray-400 font-bold">
                  Livraison estimée: {new Date(tracking.estimatedDelivery).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshTracking}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-xl hover:bg-gray-100"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Historique</p>
          <div className="space-y-3">
            {tracking.events.map((event, index) => {
              const eventStatus = statusConfig[event.status as keyof typeof statusConfig];
              const EventIcon = eventStatus.icon;
              const isLast = index === tracking.events.length - 1;

              return (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-xl ${eventStatus.bg} ${isLast ? 'ring-2 ring-offset-2' : ''}`} style={{ borderColor: primaryColor, borderWidth: isLast ? '2px' : '0px' }}>
                      <EventIcon className={eventStatus.color} size={16} />
                    </div>
                    {!isLast && <div className="w-0.5 h-8 bg-gray-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-bold text-gray-900">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 font-bold">
                        {new Date(event.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {event.location && (
                        <>
                          <span className="text-gray-300">•</span>
                          <p className="text-xs text-gray-400 font-bold">{event.location}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {tracking.currentStatus === 'in_transit' && (
          <Button
            className="w-full h-12 rounded-2xl font-black gap-2"
            style={{ backgroundColor: primaryColor }}
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${tracking.carrier}+tracking+${tracking.trackingNumber}`, '_blank')}
          >
            <MapPin size={18} />
            Suivre sur carte
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryTracking;
