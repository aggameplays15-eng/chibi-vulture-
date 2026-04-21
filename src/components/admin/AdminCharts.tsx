"use client";

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useApp } from '@/context/AppContext';

interface ChartPoint { name: string; ventes: number; commandes: number; }

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const AdminCharts = () => {
  const { orders, primaryColor } = useApp();
  const [data, setData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Construire les données des 7 derniers jours depuis les commandes
    const now = new Date();
    const points: ChartPoint[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return { name: DAYS[d.getDay()], ventes: 0, commandes: 0 };
    });

    if (Array.isArray(orders)) {
      orders.forEach(order => {
        const orderDate = new Date(order.date || order.created_at);
        const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          points[idx].ventes += order.total || 0;
          points[idx].commandes += 1;
        }
      });
    }

    setData(points);
    setIsLoading(false);
  }, [orders]);

  return (
    <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-500" />
          Performance — 7 derniers jours
        </CardTitle>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Revenus</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Commandes</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="commandes" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorCommandes)" />
              <Area type="monotone" dataKey="ventes" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#colorVentes)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCharts;
