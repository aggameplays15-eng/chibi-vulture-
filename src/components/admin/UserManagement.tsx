"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  MoreVertical, UserX, Mail, ShieldCheck, UserCheck,
  Trash2, CheckCircle, Search, ChevronLeft, ChevronRight,
  ShieldOff, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAdminAction } from './AdminActivityLog';

const PAGE_SIZE = 8;

type FilterStatus = 'Tous' | 'Actif' | 'Banni' | 'En attente';

// Statut visuel d'un utilisateur
function getUserStatus(user: any): { label: string; color: string; dot: string } {
  if (!user.isApproved && user.role !== 'Admin') return { label: 'En attente', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' };
  if (user.status === 'Banni') return { label: 'Banni', color: 'bg-red-50 text-red-500', dot: 'bg-red-500' };
  return { label: 'Actif', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' };
}

const UserManagement = () => {
  const { users, primaryColor } = useApp();
  const safeUsers = useMemo(() => Array.isArray(users) ? users : [], [users]);

  // État local pour refléter les changements immédiatement sans attendre le contexte
  const [overrides, setOverrides] = useState<Record<number, Partial<any>>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Tous');
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Fusionner les overrides locaux avec les données du contexte
  const mergedUsers = useMemo(() =>
    safeUsers
      .filter(u => !deletedIds.has(u.id))
      .map(u => ({ ...u, ...(overrides[u.id] || {}) })),
    [safeUsers, overrides, deletedIds]
  );

  const applyOverride = useCallback((id: number, patch: Partial<any>) => {
    setOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  }, []);

  const filtered = useMemo(() => {
    return mergedUsers.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.handle || '').toLowerCase().includes(q);

      const status = getUserStatus(u);
      const matchStatus =
        filterStatus === 'Tous' ? true :
        filterStatus === 'En attente' ? status.label === 'En attente' :
        filterStatus === 'Banni' ? status.label === 'Banni' :
        status.label === 'Actif';

      return matchSearch && matchStatus;
    });
  }, [mergedUsers, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    pending: mergedUsers.filter(u => getUserStatus(u).label === 'En attente').length,
    banned: mergedUsers.filter(u => u.status === 'Banni').length,
  }), [mergedUsers]);

  // ── Actions ──────────────────────────────────────────────
  const handleApprove = async (id: number, name: string) => {
    setLoadingId(id);
    try {
      await apiService.updateUser({ id, is_approved: true });
      applyOverride(id, { isApproved: true, is_approved: true });
      logAdminAction('Utilisateur approuvé', name, 'user');
      showSuccess(`${name} approuvé ! ✅`);
    } catch {
      showError("Impossible d'approuver.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleBan = async (id: number, name: string) => {
    setLoadingId(id);
    try {
      await apiService.updateUser({ id, status: 'Banni' });
      applyOverride(id, { status: 'Banni' });
      logAdminAction('Utilisateur banni', name, 'user');
      showSuccess(`${name} banni.`);
    } catch {
      showError("Impossible de bannir.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnban = async (id: number, name: string) => {
    setLoadingId(id);
    try {
      await apiService.updateUser({ id, status: 'Actif' });
      applyOverride(id, { status: 'Actif' });
      logAdminAction('Utilisateur débanni', name, 'user');
      showSuccess(`${name} débanni. ✅`);
    } catch {
      showError("Impossible de débannir.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('cv_token');
    setLoadingId(id);
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erreur serveur');
      }
      setDeletedIds(prev => new Set([...prev, id]));
      logAdminAction('Utilisateur supprimé', `ID ${id}`, 'user');
      showSuccess("Utilisateur supprimé. 🗑️");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Impossible de supprimer.");
    } finally {
      setLoadingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleContact = (email: string | undefined, name: string) => {
    if (email) window.open(`mailto:${email}?subject=Message de l'équipe Chibi Vulture`, '_blank');
    else showError(`Pas d'email pour ${name}.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Utilisateurs</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{mergedUsers.length} inscrits</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {counts.pending > 0 && (
            <Badge className="bg-orange-100 text-orange-600 border-none font-black rounded-full text-xs">
              {counts.pending} en attente
            </Badge>
          )}
          {counts.banned > 0 && (
            <Badge className="bg-red-50 text-red-500 border-none font-black rounded-full text-xs">
              {counts.banned} bannis
            </Badge>
          )}
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Nom, email, handle..."
          className="pl-10 h-12 rounded-2xl border-gray-100 bg-white text-sm" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['Tous', 'Actif', 'En attente', 'Banni'] as FilterStatus[]).map(f => (
          <button key={f} onClick={() => { setFilterStatus(f); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
              filterStatus === f ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={filterStatus === f ? { backgroundColor: primaryColor } : {}}>
            {f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {displayUsers.map((user) => {
          const status = getUserStatus(user);
          const isBanned = status.label === 'Banni';
          const isPending = status.label === 'En attente';
          const isAdmin = user.role === 'Admin';
          const isLoading = loadingId === user.id;

          return (
            <div key={user.id}
              className={`bg-white p-4 rounded-[24px] border shadow-sm flex items-center justify-between gap-3 transition-all ${
                isPending ? 'border-orange-100' : isBanned ? 'border-red-50' : 'border-gray-50'
              }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 border-2 border-white shadow-sm rounded-2xl">
                    <AvatarImage src={user.avatarImage || user.avatar_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
                    <AvatarFallback className="rounded-2xl font-black">{(user.name || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white p-0.5 rounded-full border-2 border-white">
                      <ShieldCheck size={9} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{user.email || user.handle}</p>
                  <p className="text-[10px] text-gray-300 font-bold">{user.handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Dot statut */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className="h-9 w-9 rounded-xl hover:bg-gray-50"
                      disabled={isLoading}>
                      {isLoading
                        ? <RefreshCw size={16} className="text-gray-400 animate-spin" />
                        : <MoreVertical size={16} className="text-gray-400" />
                      }
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-[20px] border-gray-100 p-2 shadow-xl min-w-[160px]">

                    <DropdownMenuItem onClick={() => handleContact(user.email, user.name)}
                      className="gap-2.5 font-bold text-xs rounded-xl p-3 cursor-pointer">
                      <Mail size={15} className="text-blue-500" /> Contacter
                    </DropdownMenuItem>

                    {isPending && (
                      <DropdownMenuItem onClick={() => handleApprove(user.id, user.name)}
                        className="gap-2.5 font-bold text-xs rounded-xl p-3 text-emerald-600 focus:bg-emerald-50 cursor-pointer">
                        <CheckCircle size={15} /> Approuver
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-gray-50 my-1" />

                    {isBanned ? (
                      <DropdownMenuItem onClick={() => handleUnban(user.id, user.name)}
                        className="gap-2.5 font-bold text-xs rounded-xl p-3 text-blue-600 focus:bg-blue-50 cursor-pointer">
                        <ShieldOff size={15} /> Débannir
                      </DropdownMenuItem>
                    ) : !isAdmin && (
                      <DropdownMenuItem onClick={() => handleBan(user.id, user.name)}
                        className="gap-2.5 font-bold text-xs rounded-xl p-3 text-rose-500 focus:bg-rose-50 cursor-pointer">
                        <UserX size={15} /> Bannir
                      </DropdownMenuItem>
                    )}

                    {!isAdmin && (
                      <DropdownMenuItem onClick={() => setConfirmDeleteId(user.id)}
                        className="gap-2.5 font-bold text-xs rounded-xl p-3 text-red-600 focus:bg-red-50 cursor-pointer">
                        <Trash2 size={15} /> Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}

        {displayUsers.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <UserCheck size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <Button variant="ghost" size="sm" disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl gap-1 font-bold text-xs">
            <ChevronLeft size={14} /> Préc.
          </Button>
          <span className="text-xs font-black text-gray-400">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl gap-1 font-bold text-xs">
            Suiv. <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Confirmation suppression */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte sera désactivé définitivement. Les données sont conservées pour l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600"
              onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
