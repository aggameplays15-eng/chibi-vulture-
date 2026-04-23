"use client";

import React, { useState } from 'react';
import { Check, X, Clock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess, showError } from "@/utils/toast";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { getAvatarUrl } from '@/utils/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAdminAction } from './AdminActivityLog';

const PendingApprovals = () => {
  const { users, approveUser, primaryColor } = useApp();
  const safeUsers = Array.isArray(users) ? users : [];
  const pendingUsers = safeUsers.filter(u => !u.isApproved && u.role !== 'Admin' && u.status !== 'Banni' && u.status !== 'Supprimé');

  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectName, setRejectName] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState<number | null>(null);

  const handleApprove = async (id: number, name: string) => {
    setLoading(id);
    try {
      await approveUser(id);
      logAdminAction('Utilisateur approuvé', name, 'user');
      showSuccess(`${name} approuvé ! ✅`);
    } catch {
      showError("Impossible d'approuver cet utilisateur.");
    } finally {
      setLoading(null);
    }
  };

  // BUG FIX: rejeter = supprimer le compte (soft delete), pas bannir
  const handleReject = async (id: number) => {
    const token = localStorage.getItem('cv_token');
    setLoading(id);
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      logAdminAction('Demande rejetée', rejectName, 'user');
      showSuccess(`Demande de ${rejectName} rejetée.`);
    } catch {
      showError("Impossible de rejeter cette demande.");
    } finally {
      setLoading(null);
      setRejectId(null);
      setRejectName('');
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Check size={16} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-700">Tout est à jour</p>
          <p className="text-[10px] text-emerald-500 font-bold">Aucune demande en attente d'approbation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header cliquable pour réduire/agrandir */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-2 group"
      >
        <h3 className="font-black text-gray-800 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" />
          Approbations en attente
          <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
            {pendingUsers.length}
          </span>
        </h3>
        {expanded
          ? <ChevronUp size={16} className="text-gray-400" />
          : <ChevronDown size={16} className="text-gray-400" />
        }
      </button>

      {expanded && (
        <div className="space-y-2">
          {pendingUsers.map((user) => (
            <div key={user.id}
              className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-11 w-11 border-2 border-orange-100 rounded-2xl flex-shrink-0">
                  <AvatarImage src={getAvatarUrl(user.avatarImage, user.name)} />
                  <AvatarFallback className="rounded-2xl font-black">{(user.name || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{user.email || user.handle}</p>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-wide mt-0.5">
                    ⏳ En attente
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Contacter */}
                {user.email && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-blue-50"
                    title="Contacter par email"
                    onClick={() => window.open(`mailto:${user.email}?subject=Votre demande sur Chibi Vulture`, '_blank')}
                  >
                    <Mail size={15} className="text-blue-400" />
                  </Button>
                )}
                {/* Rejeter */}
                <Button
                  variant="ghost" size="icon"
                  disabled={loading === user.id}
                  className="h-9 w-9 rounded-xl hover:bg-rose-50"
                  title="Rejeter la demande"
                  onClick={() => { setRejectId(user.id); setRejectName(user.name); }}
                >
                  <X size={15} className="text-rose-500" />
                </Button>
                {/* Approuver */}
                <Button
                  size="sm"
                  disabled={loading === user.id}
                  className="h-9 px-3 rounded-xl text-white font-black text-xs gap-1"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => handleApprove(user.id, user.name)}
                >
                  <Check size={14} />
                  {loading === user.id ? '...' : 'Approuver'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation rejet */}
      <AlertDialog open={rejectId !== null} onOpenChange={() => { setRejectId(null); setRejectName(''); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la demande de {rejectName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte sera supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-500 hover:bg-rose-600"
              onClick={() => rejectId !== null && handleReject(rejectId)}>
              Rejeter et supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingApprovals;
