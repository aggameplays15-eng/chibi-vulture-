"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  User, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Heart,
  ShoppingBag,
  Info,
  X
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';

const MobileMenu = () => {
  const navigate = useNavigate();
  const { user, logout, primaryColor } = useApp();

  const menuItems = [
    { icon: User, label: "Mon Profil", path: "/profile", color: "text-blue-500" },
    { icon: Bell, label: "Notifications", path: "/notifications", color: "text-pink-500" },
    { icon: ShoppingBag, label: "Ma Boutique", path: "/shop", color: "text-purple-500" },
    { icon: Heart, label: "Coups de cœur", path: "/profile", color: "text-red-500" },
    { icon: Settings, label: "Paramètres", path: "/settings", color: "text-gray-500" },
    { icon: HelpCircle, label: "Aide & Support", path: "/support", color: "text-orange-500" },
    { icon: Info, label: "Légal", path: "/terms", color: "text-blue-400" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-10 h-10 rounded-full text-gray-800 transition-all active:scale-90"
          style={{ '--hover-bg': `${primaryColor}15` } as any}
        >
          <Menu size={24} strokeWidth={2.5} />
        </Button>
      </DrawerTrigger>
      <DrawerContent 
        className="rounded-t-[40px] bg-white max-h-[85vh]"
        style={{ borderTop: `2px solid ${primaryColor}15` }}
      >
        <div className="mx-auto w-12 h-1.5 bg-gray-100 rounded-full mt-3 mb-2" />
        
        <div className="flex flex-col h-full">
          <DrawerHeader className="p-6 border-b" style={{ borderColor: `${primaryColor}15` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 shadow-sm" style={{ border: `4px solid ${primaryColor}15` }}>
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}&backgroundColor=${user.avatarColor?.replace('#', '')}`} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <DrawerTitle className="text-lg font-black text-gray-900">{user.name}</DrawerTitle>
                  <p className="text-xs font-bold" style={{ color: primaryColor }}>{user.handle}</p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-50">
                  <X size={18} />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
            {menuItems.map((item) => (
              <DrawerClose asChild key={item.label}>
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-colors group"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className={`p-2 rounded-xl bg-gray-50 group-hover:bg-white transition-colors ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="font-bold text-sm text-gray-700">{item.label}</span>
                </button>
              </DrawerClose>
            ))}

            {user.role === "Admin" && (
              <DrawerClose asChild>
                <button
                  onClick={() => navigate('/goated-panel')}
                  className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-colors group mt-2"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  <div className="p-2 rounded-xl bg-white" style={{ color: primaryColor }}>
                    <ShieldCheck size={18} />
                  </div>
                  <span className="font-black text-sm" style={{ color: primaryColor }}>ADMINISTRATION</span>
                </button>
              </DrawerClose>
            )}
          </div>

          <div className="p-6 border-t mb-4" style={{ borderColor: `${primaryColor}15` }}>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full h-12 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 font-black flex gap-3"
            >
              <LogOut size={18} />
              DÉCONNEXION
            </Button>
            <p className="text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-4">
              Chibi Vulture v1.0.4
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>

  );
};

export default MobileMenu;