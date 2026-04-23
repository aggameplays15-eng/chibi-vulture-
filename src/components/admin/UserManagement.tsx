"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  MoreVertical, UserX, Mail, ShieldCheck, Trash2,
  CheckCircle, Search, ChevronLeft, ChevronRight,
  ShieldOff, RefreshCw, Users, Ban, UserCheck2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const PAGE_SIZE = 10;
type FilterStatus = 'Tous' | 'Actif' | 'Banni';

interface UserRow {
  id: number;
  name: string;
  handle: string;
  email?: string;
  role: string;
  status: string;
  is_approved: boolean;
  isApproved?: boolean;
  avatar_image?: string;
  avatarImage?: string;
  created_at?: string;
}

function getStatus(u: UserRow) {
  if (u.status === 'Banni') return { label: 'Banni', dot: 'bg-red-500', badge: 'bg-red-50 text-red-500' };
  return { label: 'Actif', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600' };
}

const UserManagement = () => {
  const { primaryColor } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('Tous');
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  // Charger les utilisateurs depuis l'API
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch {
      showError("Impossible de charger les utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const token = () => localStorage.getItem('cv_token');

  // ── Actions ──────────────────────────────────────────────

  const handleBan = async (user: UserRow) => {
    setLoadingId(user.id);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: user.id, status: 'Banni' }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Erreur');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'Banni' } : u));
      logAdminAction('Utilisateur banni', user.name, 'user');
      showSuccess(`${user.name} banni. 🚫`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Impossible de bannir.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnban = async (user: UserRow) => {
    setLoadingId(user.id);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ id: user.id, status: 'Actif' }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Erreur');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'Actif' } : u));
      logAdminAction('Utilisateur débanni', user.name, 'user');
      showSuccess(`${user.name} débanni. ✅`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Impossible de débannir.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (user: UserRow) => {
    setLoadingId(user.id);
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Erreur');
      setUsers(prev => prev.filter(u => u.id !== user.id));
      logAdminAction('Utilisateur supprimé', user.name, 'user');
      showSuccess(`${user.name} supprimé. 🗑️`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Impossible de supprimer.");
    } finally {
      setLoadingId(null);
      setConfirmDelete(null);
    }
  };

  const handleContact = (user: UserRow) => {
    if (user.email) {
      window.open(`mailto:${user.email}?subject=Message de l'équipe Chibi Vulture`, '_blank');
    } else {
      showError(`Pas d'email pour ${user.name}.`);
    }
  };

  // ── Filtrage ─────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.handle || '').toLowerCase().includes(q);
      const matchFilter =
        filter === 'Tous' ? true :
        filter === 'Banni' ? u.status === 'Banni' :
        u.status !== 'Banni';
      return matchSearch && matchFilter;
    });
  }, [users, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    total: users.length,
    banned: users.filter(u => u.status === 'Banni').length,
    active: users.filter(u => u.status !== 'Banni').length,
  }), [users]);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <Users size={18} style={{ color: primaryColor }} />
            Utilisateurs
          </h3>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] font-black text-gray-400 uppercase">{counts.total} inscrits</span>
            {counts.banned > 0 && (
              <span className="text-[10px] font-black text-red-400 uppercase">{counts.banned} bannis</span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={loadUsers}
          className="h-9 w-9 rounded-xl hover:bg-gray-100" title="Actualiser">
          <RefreshCw size={15} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom, email ou handle..."
          className="pl-10 h-11 rounded-2xl border-gray-100 bg-gray-50 text-sm" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['Tous', 'Actif', 'Banni'] as FilterStatus[]).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
              filter === f ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={filter === f ? { backgroundColor: primaryColor } : {}}>
            {f}
            {f === 'Banni' && counts.banned > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                {counts.banned}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((user) => {
            const st = getStatus(user);
            const isAdmin = user.role === 'Admin';
            const isBanned = user.status === 'Banni';
            const busy = loadingId === user.id;
            const avatar = user.avatarImage || user.avatar_image
              || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

            return (
              <div key={user.id}
                className={`bg-white p-3.5 rounded-2xl border shadow-sm flex items-center gap-3 transition-all ${
                  isBanned ? 'border-red-100 opacity-75' : 'border-gray-50 hover:border-gray-100'
                }`}>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-11 w-11 rounded-2xl border border-gray-100">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="rounded-2xl font-black text-sm">
                      {(user.name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 text-white p-0.5 rounded-full border-2 border-white">
                      <ShieldCheck size={8} />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                    {isAdmin && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        Admin
                      </span>
                    )}
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${st.badge}`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{user.email || '—'}</p>
                  <p className="text-[10px] text-gray-300 font-bold">{user.handle}</p>
                </div>

                {/* Dot + Menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-gray-50"
                        disabled={busy}>
                        {busy
                          ? <RefreshCw size={14} className="text-gray-400 animate-spin" />
                          : <MoreVertical size={15} className="text-gray-400" />
                        }
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end"
                      className="rounded-[20px] border-gray-100 p-2 shadow-xl min-w-[170px]">

                      {/* Contacter */}
                      <DropdownMenuItem onClick={() => handleContact(user)}
                        className="gap-2.5 font-bold text-xs rounded-xl p-3 cursor-pointer">
                        <Mail size={14} className="text-blue-500" /> Contacter
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-gray-50 my-1" />

                      {/* Bannir / Débannir — pas sur l'admin */}
                      {!isAdmin && (
                        isBanned ? (
                          <DropdownMenuItem onClick={() => handleUnban(user)}
                            className="gap-2.5 font-bold text-xs rounded-xl p-3 text-emerald-600 focus:bg-emerald-50 cursor-pointer">
                            <ShieldOff size={14} /> Débannir
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleBan(user)}
                            className="gap-2.5 font-bold text-xs rounded-xl p-3 text-orange-500 focus:bg-orange-50 cursor-pointer">
                            <Ban size={14} /> Bannir
                          </DropdownMenuItem>
                        )
                      )}

                      {/* Supprimer — pas sur l'admin */}
                      {!isAdmin && (
                        <DropdownMenuItem onClick={() => setConfirmDelete(user)}
                          className="gap-2.5 font-bold text-xs rounded-xl p-3 text-red-600 focus:bg-red-50 cursor-pointer">
                          <Trash2 size={14} /> Supprimer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {displayed.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-400">
              <UserCheck2 size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {confirmDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte sera désactivé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
