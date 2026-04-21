"use client";

import React, { useState } from 'react';
import { ShieldAlert, Trash2, Image } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

const PostModeration = () => {
  const { posts, deletePost } = useApp();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/posts?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      deletePost(id);
      showSuccess("Publication supprimée. 🗑️");
    } catch {
      showError("Impossible de supprimer ce post.");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-black text-gray-800 flex items-center gap-2">
        <ShieldAlert size={18} className="text-red-500" />
        Publications
        <span className="ml-auto text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {posts.length}
        </span>
      </h3>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-2xl border border-gray-50 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {post.image
                  ? <img src={post.image} alt="post" className="w-full h-full object-cover" />
                  : <Image size={20} className="m-auto mt-3 text-gray-300" />
                }
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{post.user}</p>
                <p className="text-xs text-gray-400 truncate max-w-[180px]">{post.caption}</p>
              </div>
            </div>
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
        ))}

        {posts.length === 0 && (
          <div className="text-center py-6">
            <Image size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400 font-bold">Aucune publication.</p>
          </div>
        )}
      </div>

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
