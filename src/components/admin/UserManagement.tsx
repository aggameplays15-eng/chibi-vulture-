"use client";

import React, { useState, useMemo } from 'react';
import { MoreVertical, UserX, Mail, ShieldCheck, UserCheck, Trash2, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { logAdminAction } from './AdminActivityLog';

const PAGE_SIZE = 8;

const UserManagement = () => {
  const { users, banUser, approveUser } = useApp();
  const safeUsers = Array.isArray(users) ? users : [];
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [localUsers, setLocalUsers] = useState<typeof safeUsers | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Tous' | 'Actif' | 'Banni' | 'En attente'>('Tous');
  const [page, setPage] = useState(1);

  const baseUsers = localUsers ?? safeUsers;

  const filtered = useMemo(() => {
    return baseUsers.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const handle = (u.handle || '').toLowerCase();
      const status = u.status || 'Actif';
      
      const matchSearch = !search ||
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase()) ||
        handle.includes(search.toLowerCase());
        
      const matchStatus =
        filterStatus === 'Tous' ? true :
        filterStatus === 'En attente' ? !u.isApproved && u.role !== 'Admin' :
        status === filterStatus;
        
      return matchSearch && matchStatus;
    });
  }, [baseUsers, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleFilter = (val: typeof filterStatus) => { setFilterStatus(val); setPage(1); };

  const handleBan = (id: number, name: string) => {
    banUser(id);
    setLocalUsers((localUsers ?? safeUsers).map(u => u.id === id ? { ...u, status: 'Banni' } : u));
    logAdminAction('Utilisateur banni', name, 'user');
    showSuccess(`${name} a été banni de la plateforme.`);
  };

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveUser(id);
      setLocalUsers((localUsers ?? safeUsers).map(u => u.id === id ? { ...u, isApproved: true } : u));
      logAdminAction('Utilisateur approuvé', name, 'user');
      showSuccess(`${name} a été approuvé ! ✅`);
    } catch {
      showError("Impossible d'approuver cet utilisateur.");
    }
  };

  const handleContact = (email: string | undefined, name: string) => {
    if (email) {
      window.open(`mailto:${email}?subject=Message de l'équipe Chibi Vulture`, '_blank');
    } else {
      showError(`Pas d'email pour ${name}.`);
    }
  };

  const handleDelete = async (id: number) => {
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      setLocalUsers((localUsers ?? safeUsers).filter(u => u.id !== id));
      logAdminAction('Utilisateur supprimé', `ID ${id}`, 'user');
      showSuccess("Utilisateur supprimé. 🗑️");
    } catch {
      showError("Impossible de supprimer cet utilisateur.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const pendingCount = safeUsers.filter(u => !u.isApproved && u.role !== 'Admin').length;
  const bannedCount  = safeUsers.filter(u => u.status === 'Banni').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Utilisateurs</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{safeUsers.length} inscrits</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-600 border-none font-black rounded-full">{pendingCount} en attente</Badge>
          )}
          {bannedCount > 0 && (
            <Badge className="bg-red-50 text-red-500 border-none font-black rounded-full">{bannedCount} bannis</Badge>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
        <Input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Rechercher par nom, email, handle..."
          className="pl-10 h-12 rounded-2xl border-gray-100 bg-white font-medium text-sm"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['Tous', 'Actif', 'Banni', 'En attente'] as const).map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
              filterStatus === f
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayUsers.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-[28px] border border-gray-50 shadow-sm flex items-center justify-between group hover:border-purple-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm rounded-2xl">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.id}`} />
                  <AvatarFallback>{(user.name || 'U')[0]}</AvatarFallback>
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
                  {!user.isApproved && (
                    <DropdownMenuItem
                      onClick={() => handleApprove(user.id, user.name)}
                      className="gap-3 font-bold text-xs rounded-xl p-3 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                    >
                      <CheckCircle size={16} /> Approuver
                    </DropdownMenuItem>
                  )}
                  <div className="h-px bg-gray-50 my-1" />
                  <DropdownMenuItem 
                    onClick={() => handleBan(user.id, user.name)}
                    className="gap-3 font-bold text-xs rounded-xl p-3 text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                  >
                    <UserX size={16} /> Bannir
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setConfirmDeleteId(user.id)}
                    className="gap-3 font-bold text-xs rounded-xl p-3 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={16} /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {displayUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <UserCheck size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl gap-1 font-bold text-xs"
          >
            <ChevronLeft size={14} /> Préc.
          </Button>
          <span className="text-xs font-black text-gray-400">{page} / {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl gap-1 font-bold text-xs"
          >
            Suiv. <ChevronRight size={14} />
          </Button>
        </div>
      )}

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Toutes les données de l'utilisateur seront supprimées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 hover:bg-red-600"
              onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;