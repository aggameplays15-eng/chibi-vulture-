"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from 'lucide-react';

const data = [
  { name: 'Lun', sales: 400, visits: 2400 },
  { name: 'Mar', sales: 300, visits: 1398 },
  { name: 'Mer', sales: 600, visits: 9800 },
  { name: 'Jeu', sales: 800, visits: 3908 },
  { name: 'Ven', sales: 500, visits: 4800 },
  { name: 'Sam', sales: 900, visits: 3800 },
  { name: 'Dim', sales: 1100, visits: 4300 },
];

const AdminCharts = () => {
  return (
    <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-500" />
          Performance Globale
        </CardTitle>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Ventes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pink-200" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Visites</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="visits" 
              stroke="#FBCFE8" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorVisits)" 
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#8B5CF6" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorSales)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AdminCharts;