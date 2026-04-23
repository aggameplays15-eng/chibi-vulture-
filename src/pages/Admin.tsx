"use client";

import React, { useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, ShoppingBag, Users, Zap,
  Truck, Bell, Settings2, Music, ClipboardList, Shield
} from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import AdminCharts from '@/components/admin/AdminCharts';
import AdminActivityLog from '@/components/admin/AdminActivityLog';
import ShopManagement from '@/components/admin/ShopManagement';
import PostModeration from '@/components/admin/PostModeration';
import UserManagement from '@/components/admin/UserManagement';
import LogoManagement from '@/components/admin/LogoManagement';
import PushNotificationManager from '@/components/admin/PushNotificationManager';
import DeliveryManagement from '@/components/admin/DeliveryManagement';
import MusicManager from '@/components/admin/MusicManager';
import OrdersManagement from '@/components/admin/OrdersManagement';
import SecurityDashboard from '@/components/admin/SecurityDashboard';
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

const Admin = () => {
  const { primaryColor, users, posts, orders } = useApp();

  const safeUsers  = Array.isArray(users)  ? users  : [];
  const safePosts  = Array.isArray(posts)  ? posts  : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const reportedCount = safePosts.filter(p => (p.reports || 0) > 0).length;
  const pendingOrders = safeOrders.filter(o => o.status === 'En attente').length;

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, ordersRes] = await Promise.allSettled([
          apiService.getUsers(),
          apiService.getOrders(),
        ]);
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          localStorage.setItem('cv_users_list', JSON.stringify(usersRes.value));
        }
        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          localStorage.setItem('cv_orders', JSON.stringify(ordersRes.value));
        }
      } catch (e) {
        console.error('Admin data load error:', e);
      }
    };
    load();
  }, []);

  return (
    <MainLayout>
      <header className="p-8 space-y-1">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Panel Suprême</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ADMINISTRATION</h1>
          </div>
          <div className="bg-gray-50 p-2 rounded-2xl">
            <Zap size={20} className="text-emerald-500" />
          </div>
        </div>
      </header>

      <div className="px-6 pb-10">
        <Tabs defaultValue="dashboard" className="w-full space-y-8">
          {/* Tab bar — scrollable, with labels */}
          <TabsList className="w-full bg-gray-100/50 p-1.5 rounded-[24px] h-auto border border-gray-100 overflow-x-auto no-scrollbar flex gap-1">
            <TabTrigger value="dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" />
            <TabTrigger value="orders"    icon={<ClipboardList size={15} />}   label="Commandes" badge={pendingOrders} />
            <TabTrigger value="shop"      icon={<ShoppingBag size={15} />}     label="Boutique" />
            <TabTrigger value="delivery"  icon={<Truck size={15} />}           label="Livraison" />
            <TabTrigger value="users"     icon={<Users size={15} />}           label="Utilisateurs" badge={reportedCount} badgeColor="orange" />
            <TabTrigger value="notifs"    icon={<Bell size={15} />}            label="Notifs" />
            <TabTrigger value="appearance" icon={<Settings2 size={15} />}     label="Apparence" />
            <TabTrigger value="music"     icon={<Music size={15} />}           label="Musique" />
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminStats />
            <AdminCharts />
            <AdminActivityLog />
          </TabsContent>

          <TabsContent value="orders" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="shop" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShopManagement />
          </TabsContent>

          <TabsContent value="delivery" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <UserManagement />
              <PostModeration />
            </div>
          </TabsContent>

          <TabsContent value="notifs" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PushNotificationManager />
          </TabsContent>

          <TabsContent value="security" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LogoManagement />
          </TabsContent>

          <TabsContent value="music" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MusicManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

// Reusable tab trigger with label + optional badge
const TabTrigger = ({
  value, icon, label, badge, badgeColor = 'purple'
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: 'purple' | 'orange' | 'red';
}) => {
  const badgeClasses = {
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red:    'bg-red-500',
  };

  return (
    <TabsTrigger
      value={value}
      className="relative flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-[18px] min-w-[60px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all text-gray-400"
    >
      <div className="relative">
        {icon}
        {!!badge && badge > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 ${badgeClasses[badgeColor]} text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center`}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-wide leading-none">{label}</span>
    </TabsTrigger>
  );
};

export default Admin;
