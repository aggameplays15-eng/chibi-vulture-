"use client";

import React, { useState, useMemo } from 'react';
import { ShieldAlert, Trash2, ImageIcon, Flag, Eye, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { logAdminAction } from './AdminActivityLog';

const PostModeration = () => {
  const { posts, deletePost } = useApp();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [previewPost, setPreviewPost] = useState<typeof posts[0] | null>(null);
  const [filter, setFilter] = useState<'Tous' | 'Signalés'>('Tous');

  const safePosts = Array.isArray(posts) ? posts : [];

  const filtered = useMemo(() => {
    if (filter === 'Signalés') return safePosts.filter(p => (p.reports || 0) > 0);
    return safePosts;
  }, [safePosts, filter]);

  const reportedCount = safePosts.filter(p => (p.reports || 0) > 0).length;

  const handleDelete = async (id: number) => {
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/posts?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      deletePost(id);
      setPreviewPost(null);
      logAdminAction('Post supprimé', `Post #${id}`, 'moderation');
      showSuccess("Publication supprimée. 🗑️");
    } catch {
      showError("Impossible de supprimer ce post.");
    } finally {
      setConfirmId(null);
    }
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
            {safePosts.length}
          </span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(['Tous', 'Signalés'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${
              filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {post.image
                  ? <img src={post.image} alt="post" className="w-full h-full object-cover" />
                  : <ImageIcon size={20} className="m-auto mt-3 text-gray-300" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800">{post.user}</p>
                  {(post.reports || 0) > 0 && (
                    <Badge className="bg-red-50 text-red-500 border-none text-[9px] font-black px-1.5 py-0 h-4 rounded-full">
                      <Flag size={8} className="mr-0.5" />{post.reports}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate max-w-[160px]">{post.caption}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button
                onClick={() => setPreviewPost(post)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-gray-50"
                title="Prévisualiser"
              >
                <Eye size={14} className="text-gray-400" />
              </Button>
              <Button
                onClick={() => setConfirmId(post.id)}
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex-shrink-0"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-6">
            <ImageIcon size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400 font-bold">
              {filter === 'Signalés' ? 'Aucun post signalé.' : 'Aucune publication.'}
            </p>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-black text-sm flex items-center justify-between">
              <span>Post de {previewPost?.user}</span>
            </DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="space-y-3 p-4">
              {previewPost.image && (
                <div className="rounded-2xl overflow-hidden bg-gray-100 max-h-64">
                  <img src={previewPost.image} alt="post" className="w-full h-full object-cover" />
                </div>
              )}
              {previewPost.caption && (
                <p className="text-sm text-gray-700 font-medium leading-relaxed">{previewPost.caption}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                  <span>❤️ {previewPost.likes}</span>
                  {(previewPost.reports || 0) > 0 && (
                    <span className="text-red-500"><Flag size={10} className="inline mr-1" />{previewPost.reports} signalement(s)</span>
                  )}
                </div>
                <Button
                  onClick={() => { setConfirmId(previewPost.id); setPreviewPost(null); }}
                  size="sm"
                  className="rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black gap-1"
                >
                  <Trash2 size={12} /> Supprimer
                </Button>
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
            <AlertDialogAction
              className="rounded-xl bg-red-500 hover:bg-red-600"
              onClick={() => confirmId !== null && handleDelete(confirmId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostModeration;
