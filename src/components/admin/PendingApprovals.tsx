"use client";

import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';

const PendingApprovals = () => {
  const { users, approveUser, banUser } = useApp();
  const safeUsers   = Array.isArray(users) ? users : [];
  const pendingUsers = safeUsers.filter(u => !u.isApproved && u.role !== 'Guest');

  const handleApprove = (id: number, name: string) => {
    approveUser(id);
    showSuccess(`Compte de ${name} approuvé ! ✅`);
  };

  const handleReject = (id: number, name: string) => {
    banUser(id);
    showError(`Demande de ${name} rejetée.`);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-black text-gray-800 flex items-center gap-2 px-2">
        <Clock size={18} className="text-orange-500" />
        Approbations en attente
        {pendingUsers.length > 0 && (
          <span className="ml-auto text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
            {pendingUsers.length}
          </span>
        )}
      </h3>
      
      <div className="space-y-3">
        {pendingUsers.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-2xl border border-orange-50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{user.role} · En attente</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleApprove(user.id, user.name)}
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                title="Approuver"
              >
                <Check size={14} />
              </Button>
              <Button
                onClick={() => handleReject(user.id, user.name)}
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                title="Rejeter"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        ))}
        {pendingUsers.length === 0 && (
          <p className="text-center py-4 text-xs text-gray-400 font-bold">Aucune demande en attente.</p>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;