"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Users, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

interface ArtistStats {
  totalSales: number;
  totalRevenue: number;
  productsSold: number;
  activeProducts: number;
  monthlyRevenue: number;
  topProducts: { name: string; sales: number; revenue: number }[];
}

const ArtistDashboard = () => {
  const { products, primaryColor } = useApp();
  const [stats, setStats] = useState<ArtistStats>({
    totalSales: 0,
    totalRevenue: 0,
    productsSold: 0,
    activeProducts: products.length,
    monthlyRevenue: 0,
    topProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadArtistStats();
  }, [selectedPeriod]);

  const loadArtistStats = async () => {
    try {
      setIsLoading(true);
      // Use real API call for artist stats
      const artistId = 1; // In production, get from current user
      const response = await apiService.getArtistStats(artistId, selectedPeriod);
      
      setStats({
        totalSales: response.stats.total_sales,
        totalRevenue: response.stats.total_revenue,
        productsSold: response.stats.products_sold,
        activeProducts: response.stats.active_products,
        monthlyRevenue: selectedPeriod === 'month' ? response.stats.total_revenue : 0,
        topProducts: response.topProducts
      });
    } catch (error) {
      console.error('Failed to load artist stats:', error);
      setStats({
        totalSales: 0,
        totalRevenue: 0,
        productsSold: 0,
        activeProducts: 0,
        monthlyRevenue: 0,
        topProducts: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { 
      label: "Ventes Totales", 
      value: stats.totalSales.toLocaleString(), 
      icon: Package, 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Revenus", 
      value: `${(stats.totalRevenue / 1000000).toFixed(1)}M GNF`, 
      icon: DollarSign, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50" 
    },
    { 
      label: "Produits Actifs", 
      value: stats.activeProducts.toString(), 
      icon: BarChart3, 
      color: "text-purple-500", 
      bg: "bg-purple-50" 
    },
    { 
      label: "Revenu Mensuel", 
      value: `${(stats.monthlyRevenue / 1000000).toFixed(1)}M GNF`, 
      icon: TrendingUp, 
      color: "text-orange-500", 
      bg: "bg-orange-50" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Dashboard Artiste</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Vos performances</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                selectedPeriod === period
                  ? 'text-white'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              style={selectedPeriod === period ? { backgroundColor: primaryColor } : {}}
            >
              {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
            <CardContent className="p-5">
              <div className={`p-3 rounded-2xl ${stat.bg} w-fit mb-3`}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <p className="text-2xl font-black text-gray-900">
                {isLoading ? '...' : stat.value}
              </p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Products */}
      <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}20` }}>
              <TrendingUp size={18} style={{ color: primaryColor }} />
            </div>
            <h4 className="font-black text-gray-900">Top Produits</h4>
          </div>
          
          {stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: primaryColor }}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-400">{product.sales} vendus</p>
                    </div>
                  </div>
                  <p className="text-sm font-black" style={{ color: primaryColor }}>
                    {(product.revenue / 1000000).toFixed(1)}M GNF
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-gray-400 text-sm font-bold">
              Aucune vente pour le moment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}20` }}>
              <Calendar size={18} style={{ color: primaryColor }} />
            </div>
            <h4 className="font-black text-gray-900">Performance Temporelle</h4>
          </div>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl">
            <p className="text-gray-400 text-sm font-bold">Graphique de performance à venir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtistDashboard;
