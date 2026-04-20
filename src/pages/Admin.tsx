"use client";

import React, { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, ShoppingBag, ShieldCheck, Users, Activity, Palette, Truck, Bell, Settings2 } from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import AdminCharts from '@/components/admin/AdminCharts';
import ShopManagement from '@/components/admin/ShopManagement';
import PostModeration from '@/components/admin/PostModeration';
import UserManagement from '@/components/admin/UserManagement';
import PendingApprovals from '@/components/admin/PendingApprovals';
import LogoManagement from '@/components/admin/LogoManagement';
import PushNotificationManager from '@/components/admin/PushNotificationManager';
import DeliveryManagement from '@/components/admin/DeliveryManagement';
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

const Admin = () => {
  const { setUsers, setOrders } = useApp() as ReturnType<typeof useApp> & {
    setUsers?: (u: unknown[]) => void;
    setOrders?: (o: unknown[]) => void;
  };

  // Charger les données admin-only au montage
  useEffect(() => {
    const load = async () => {
      try {
        const [users, orders] = await Promise.allSettled([
          apiService.getUsers(),
          apiService.getOrders(),
        ]);
        if (users.status === 'fulfilled' && Array.isArray(users.value)) {
          localStorage.setItem('cv_users_list', JSON.stringify(users.value));
        }
        if (orders.status === 'fulfilled' && Array.isArray(orders.value)) {
          localStorage.setItem('cv_orders', JSON.stringify(orders.value));
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
          <div className="bg-gray-50 p-2 rounded-2xl text-gray-400">
            <Activity size={20} className="text-emerald-500" />
          </div>
        </div>
      </header>

      <div className="px-6 pb-10">
        <Tabs defaultValue="dashboard" className="w-full space-y-8">
          <TabsList className="w-full bg-gray-100/50 p-1.5 rounded-[24px] h-14 border border-gray-100 overflow-x-auto no-scrollbar">
            <TabsTrigger value="dashboard" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <LayoutDashboard size={18} />
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <ShoppingBag size={18} />
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <Truck size={18} />
            </TabsTrigger>
            <TabsTrigger value="mod" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <ShieldCheck size={18} />
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <Users size={18} />
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <Bell size={18} />
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1 rounded-[18px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 transition-all">
              <Settings2 size={18} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AdminStats />
            <AdminCharts />
          </TabsContent>

          <TabsContent value="shop" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ShopManagement />
          </TabsContent>

          <TabsContent value="delivery" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="mod" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <PendingApprovals />
              <PostModeration />
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserManagement />
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PushNotificationManager />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LogoManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Admin;