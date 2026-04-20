"use client";

import React from 'react';
import { TrendingUp, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Zap, Target } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';

const AdminStats = () => {
  const { orders, users, posts } = useApp();

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeUsers  = Array.isArray(users)  ? users  : [];
  const safePosts  = Array.isArray(posts)  ? posts  : [];

  const totalRevenue  = safeOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const reportedPosts = safePosts.filter(p => (p.reports || 0) > 0).length;

  const stats = [
    { label: "Revenus",      value: `${(totalRevenue / 1000000).toFixed(1)}M GNF`, icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-50", trend: "+12%",         up: true  },
    { label: "Utilisateurs", value: safeUsers.length.toString(),                   icon: Users,         color: "text-blue-500",    bg: "bg-blue-50",    trend: "Total",        up: null  },
    { label: "Commandes",    value: safeOrders.length.toString(),                  icon: Zap,           color: "text-yellow-500",  bg: "bg-yellow-50",  trend: "Live",         up: null  },
    { label: "Alertes",      value: reportedPosts.toString(),                      icon: AlertTriangle, color: "text-rose-500",    bg: "bg-rose-50",    trend: "Signalements", up: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white group hover:shadow-md transition-all duration-300">
          <CardContent className="p-5 flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div className={`${stat.bg} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                <stat.icon className={stat.color} size={22} />
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full ${
                  stat.trend === 'Live' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                  stat.up === true ? 'bg-emerald-50 text-emerald-600' : 
                  stat.up === false ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-500'
                }`}>
                  {stat.up === true && <ArrowUpRight size={10} />}
                  {stat.up === false && <ArrowDownRight size={10} />}
                  {stat.trend}
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{stat.value}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;