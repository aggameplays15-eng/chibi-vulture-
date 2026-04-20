"use client";

import React from 'react';
import { ShieldAlert, Check, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from '@/context/AppContext';
import { showSuccess } from '@/utils/toast';

const PostModeration = () => {
  const { posts, deletePost } = useApp();
  const reportedPosts = posts.filter(p => (p.reports || 0) > 0);

  const handleKeep = (id: number) => {
    showSuccess("Post approuvé — signalement ignoré. ✅");
  };

  const handleDelete = (id: number) => {
    deletePost(id);
    showSuccess("Publication supprimée. 🗑️");
  };

  return (
    <div className="space-y-4">
      <h3 className="font-black text-gray-800 flex items-center gap-2">
        <ShieldAlert size={18} className="text-red-500" />
        Signalements en attente
        {reportedPosts.length > 0 && (
          <span className="ml-auto text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {reportedPosts.length}
          </span>
        )}
      </h3>
      
      <div className="space-y-3">
        {reportedPosts.map((post) => (
          <div key={post.id} className="bg-white p-4 rounded-2xl border border-red-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={post.image} alt="Reported" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold">{post.user}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[160px]">{post.caption}</p>
                  <Badge className="mt-1 text-[8px] font-black bg-red-50 text-red-500 border-none px-2">
                    {post.reports} signalement{(post.reports || 0) > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleKeep(post.id)}
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                  title="Approuver"
                >
                  <Check size={14} />
                </Button>
                <Button 
                  onClick={() => handleDelete(post.id)}
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {reportedPosts.length === 0 && (
          <div className="text-center py-6">
            <Eye size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400 font-bold">Aucun signalement à traiter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostModeration;