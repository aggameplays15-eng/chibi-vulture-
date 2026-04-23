"use client";

import React, { useState, useMemo } from 'react';
import { ShieldAlert, Trash2, ImageIcon, Flag, Eye, CheckCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAdminAction } from './AdminActivityLog';

const PostModeration = () => {
  const { posts, deletePost, primaryColor } = useApp();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [previewPost, setPreviewPost] = useState<typeof posts[0] | null>(null);
  const [filter, setFilter] = useState<'Tous' | 'Signalés'>('Tous');
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const safePosts = Array.isArray(posts) ? posts : [];

  const filtered = useMemo(() => {
    const base = safePosts.filter(p => !dismissed.has(p.id));
    if (filter === 'Signalés') return base.filter(p => (p.reports || 0) > 0);
    return base;
  }, [safePosts, filter, dismissed]);

  const reportedCount = safePosts.filter(p => (p.reports || 0) > 0 && !dismissed.has(p.id)).length;

  const handleDelete = async (id: number) => {
    // BUG FIX: localStorage au lieu de sessionStorage
    const token = localStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/posts?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erreur serveur');
      }
      deletePost(id);
      setPreviewPost(null);
      logAdminAction('Post supprimé', `Post #${id}`, 'moderation');
      showSuccess("Publication supprimée. 🗑️");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Impossible de supprimer ce post.");
    } finally {
      setConfirmId(null);
    }
  };

  // Ignorer un signalement sans supprimer le post
  const handleDismiss = (id: number) => {
    setDismissed(prev => new Set([...prev, id]));
    logAdminAction('Signalement ignoré', `Post #${id}`, 'moderation');
    showSuccess("Signalement ignoré.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-black text-gray-800 flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-500" />
          Publications
        </h3>
        <div className="flex items-center gap-2">
          {reportedCount > 0 && (
            <Badge className="bg-red-50 text-red-500 border-none font-black rounded-full text-[10px]">
              <Flag size={9} className="mr-1" />{reportedCount} signalés
            </Badge>
          )}
          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['Tous', 'Signalés'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
              filter === f ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={filter === f ? { backgroundColor: primaryColor } : {}}>
            {f}
            {f === 'Signalés' && reportedCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                {reportedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((post) => {
          const isReported = (post.reports || 0) > 0;
          return (
            <div key={post.id}
              className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
                isReported ? 'border-red-100 bg-red-50/30' : 'border-gray-50'
              }`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                  {post.image
                    ? <img src={post.image} alt="post" className="w-full h-full object-cover" />
                    : <ImageIcon size={20} className="m-auto mt-3 text-gray-300" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-gray-800">{post.user}</p>
                    <span className="text-[10px] text-gray-400 font-bold">{post.handle}</span>
                    {isReported && (
                      <Badge className="bg-red-50 text-red-500 border-none text-[9px] font-black px-1.5 py-0 h-4 rounded-full">
                        <Flag size={8} className="mr-0.5" />{post.reports} signalement{(post.reports || 0) > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-[180px]">{post.caption}</p>
                  <p className="text-[10px] text-gray-300 font-bold mt-0.5">❤️ {post.likes} · {post.time}</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-2">
                <Button onClick={() => setPreviewPost(post)} variant="ghost" size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-gray-100" title="Prévisualiser">
                  <Eye size={14} className="text-gray-400" />
                </Button>
                {isReported && (
                  <Button onClick={() => handleDismiss(post.id)} variant="ghost" size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-emerald-50" title="Ignorer le signalement">
                    <CheckCheck size={14} className="text-emerald-500" />
                  </Button>
                )}
                <Button onClick={() => setConfirmId(post.id)} variant="ghost" size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-red-50" title="Supprimer">
                  <Trash2 size={14} className="text-red-400" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400 font-bold">
              {filter === 'Signalés' ? 'Aucun post signalé. ✅' : 'Aucune publication.'}
            </p>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-black text-sm">
              Post de {previewPost?.user}
              <span className="ml-2 text-[10px] text-gray-400 font-bold">{previewPost?.handle}</span>
            </DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-3 p-4">
              {previewPost.image && (
                <div className="rounded-2xl overflow-hidden bg-gray-100 max-h-72">
                  <img src={previewPost.image} alt="post" className="w-full h-full object-cover" />
                </div>
              )}
              {previewPost.caption && (
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{previewPost.caption}</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                  <span>❤️ {previewPost.likes}</span>
                  <span>💬 {previewPost.comments_count ?? 0}</span>
                  {(previewPost.reports || 0) > 0 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <Flag size={10} />{previewPost.reports} signalement(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {(previewPost.reports || 0) > 0 && (
                    <Button onClick={() => { handleDismiss(previewPost.id); setPreviewPost(null); }}
                      size="sm" variant="outline"
                      className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs font-black gap-1">
                      <CheckCheck size={12} /> Ignorer
                    </Button>
                  )}
                  <Button onClick={() => { setConfirmId(previewPost.id); setPreviewPost(null); }}
                    size="sm" className="rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black gap-1">
                    <Trash2 size={12} /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmId !== null} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce post ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600"
              onClick={() => confirmId !== null && handleDelete(confirmId)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostModeration;
