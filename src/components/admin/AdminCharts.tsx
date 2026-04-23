"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Zap, BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ChartPoint { name: string; ventes: number; commandes: number; users: number; }

const DAYS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

type Period = '7j' | '30j' | '12m';

const AdminCharts = () => {
  const { orders, users, primaryColor } = useApp();
  const [period, setPeriod] = useState<Period>('7j');

  const data = useMemo<ChartPoint[]>(() => {
    const now = new Date();
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeUsers = Array.isArray(users) ? users : [];

    if (period === '7j') {
      const points: ChartPoint[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        return { name: DAYS[d.getDay()], ventes: 0, commandes: 0, users: 0 };
      });
      
      safeOrders.forEach(order => {
        const orderDate = new Date(order.date || order.created_at);
        const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          points[idx].ventes += order.total || 0;
          points[idx].commandes += 1;
        }
      });

      safeUsers.forEach(u => {
        const uDate = new Date(u.created_at || Date.now());
        const diffDays = Math.floor((now.getTime() - uDate.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 7) {
          const idx = 6 - diffDays;
          points[idx].users += 1;
        }
      });

      return points;
    }

    if (period === '30j') {
      const points: ChartPoint[] = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        return { name: `${d.getDate()}/${d.getMonth() + 1}`, ventes: 0, commandes: 0, users: 0 };
      });
      
      safeOrders.forEach(order => {
        const orderDate = new Date(order.date || order.created_at);
        const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 30) {
          const idx = 29 - diffDays;
          points[idx].ventes += order.total || 0;
          points[idx].commandes += 1;
        }
      });

      safeUsers.forEach(u => {
        const uDate = new Date(u.created_at || Date.now());
        const diffDays = Math.floor((now.getTime() - uDate.getTime()) / 86400000);
        if (diffDays >= 0 && diffDays < 30) {
          const idx = 29 - diffDays;
          points[idx].users += 1;
        }
      });

      return points.map((p, i) => ({ ...p, name: i % 5 === 0 ? p.name : '' }));
    }

    const points: ChartPoint[] = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { name: MONTHS[d.getMonth()], ventes: 0, commandes: 0, users: 0 };
    });
    
    safeOrders.forEach(order => {
      const orderDate = new Date(order.date || order.created_at);
      const monthDiff = (now.getFullYear() - orderDate.getFullYear()) * 12 + (now.getMonth() - orderDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        const idx = 11 - monthDiff;
        points[idx].ventes += order.total || 0;
        points[idx].commandes += 1;
      }
    });

    safeUsers.forEach(u => {
      const uDate = new Date(u.created_at || Date.now());
      const monthDiff = (now.getFullYear() - uDate.getFullYear()) * 12 + (now.getMonth() - uDate.getMonth());
      if (monthDiff >= 0 && monthDiff < 12) {
        const idx = 11 - monthDiff;
        points[idx].users += 1;
      }
    });

    return points;
  }, [orders, users, period]);

  return (
    <div className="space-y-6">
      {/* Revenue & Orders Chart */}
      <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-500" />
            Performance Business
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['7j', '30j', '12m'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                    period === p ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-64 w-full">
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
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            Croissance Communauté
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} />
              <Tooltip 
                cursor={{ fill: '#F9FAFB' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
              />
              <Bar dataKey="users" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCharts;
