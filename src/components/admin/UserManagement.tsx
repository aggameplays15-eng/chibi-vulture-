"use client";

import React from 'react';
import { MoreVertical, Shield, UserX, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserManagement = () => {
  const { users, banUser, updateUser } = useApp();
  const safeUsers = Array.isArray(users) ? users : [];

  const handleBan = (id: number, name: string) => {
    banUser(id);
    showSuccess(`${name} a été banni de la plateforme.`);
  };

  const handlePromote = (id: number, name: string, currentRole: string) => {
    if (currentRole === 'Admin') {
      showError(`${name} est déjà Admin.`);
      return;
    }
    updateUser({ id, role: 'Admin' } as Parameters<typeof updateUser>[0]);
    showSuccess(`${name} promu Admin ! 🛡️`);
  };

  const handleContact = (email: string | undefined, name: string) => {
    if (email) {
      window.open(`mailto:${email}?subject=Message de l'équipe Chibi Vulture`, '_blank');
    } else {
      showError(`Pas d'email pour ${name}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-black text-gray-900 text-lg">Utilisateurs</h3>
        <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none px-3 py-1 rounded-full font-bold">
          {safeUsers.length} au total
        </Badge>
      </div>
      
      <div className="space-y-3">
        {safeUsers.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-[28px] border border-gray-50 shadow-sm flex items-center justify-between group hover:border-purple-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm rounded-2xl">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                {user.role === "Admin" && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white p-1 rounded-full border-2 border-white">
                    <ShieldCheck size={10} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-gray-900">{user.name}</p>
                  <Badge className={`text-[8px] font-black uppercase px-1.5 py-0 h-4 border-none ${
                    user.role === 'Artiste' ? 'bg-blue-50 text-blue-600' : 
                    user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'
                  }`}>
                    {user.role}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400 font-bold">{user.email || 'Pas d\'email'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${user.status === 'Banni' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-50">
                    <MoreVertical size={18} className="text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[20px] border-gray-100 p-2 shadow-xl">
                  <DropdownMenuItem
                    onClick={() => handleContact(user.email, user.name)}
                    className="gap-3 font-bold text-xs rounded-xl p-3 cursor-pointer"
                  >
                    <Mail size={16} className="text-blue-500" /> Contacter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePromote(user.id, user.name, user.role)}
                    className="gap-3 font-bold text-xs rounded-xl p-3 cursor-pointer"
                  >
                    <Shield size={16} className="text-purple-500" /> Promouvoir Admin
                  </DropdownMenuItem>
                  <div className="h-px bg-gray-50 my-1" />
                  <DropdownMenuItem 
                    onClick={() => handleBan(user.id, user.name)}
                    className="gap-3 font-bold text-xs rounded-xl p-3 text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                  >
                    <UserX size={16} /> Bannir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {safeUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <UserCheck size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Aucun utilisateur enregistré.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;