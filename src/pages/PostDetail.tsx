"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Heart, MessageCircle, Share2, Send, MoreHorizontal, Lock, ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useApp } from '@/context/AppContext';
import { showError, showSuccess } from '@/utils/toast';
import { apiService } from '@/services/api';

interface Comment {
  id: number;
  user_handle: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  replies?: Comment[];
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, likedPosts, toggleLike, posts, primaryColor } = useApp();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);

  const postId = Number(id);
  const post = posts.find(p => p.id === postId);
  const isGuest = !user.isAuthenticated;
  const isLiked = likedPosts.includes(postId);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/comments?post_id=${postId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [postId]);

  const handleDeletePost = async () => {
    try {
      await apiService.deletePost(postId);
      showSuccess("Post supprimé. 🗑️");
      navigate('/feed');
    } catch {
      showError("Impossible de supprimer ce post.");
    }
  };

  const handleDeleteComment = async (commentId: number, commentHandle: string) => {
    if (user.handle !== commentHandle) return;
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      showError("Impossible de supprimer le commentaire.");
    }
  };

  const handleSendComment = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('cv_token');
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ post_id: postId, text: comment.trim(), parent_id: replyingTo?.id || null }),
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      if (replyingTo) {
        setComments(prev => prev.map(c =>
          c.id === replyingTo.id
            ? { ...c, replies: [...(c.replies || []), { ...newComment, user_name: user.name, user_avatar: user.avatarImage }] }
            : c
        ));
      } else {
        setComments(prev => [...prev, { ...newComment, user_name: user.name, user_avatar: user.avatarImage, replies: [] }]);
      }
      setComment("");
      setReplyingTo(null);
    } catch {
      showError("Impossible d'envoyer le commentaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  if (!post) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-400 font-bold">Publication introuvable.</p>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ChevronLeft size={18} className="mr-1" /> Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="p-4 flex items-center gap-3 border-b border-pink-50 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <h1 className="font-black text-gray-800 uppercase tracking-widest text-sm">Publication</h1>
      </header>

      <div className="pb-24">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-pink-200">
              <AvatarImage src={post.avatar} />
              <AvatarFallback>{post.user?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm">{post.user}</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold">{post.time}</p>
            </div>
          </div>
          {post.handle === user.handle ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-red-400 transition-colors"
              aria-label="Supprimer ce post"
              onClick={handleDeletePost}
            >
              <Trash2 size={20} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Plus d'options">
              <MoreHorizontal size={20} />
            </Button>
          )}        </div>

        <div className="aspect-square bg-gray-100">
          <img
            src={post.image}
            alt={`Post de ${post.user}`}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(postId)}
              className={`flex items-center gap-1 transition-all ${isLiked ? 'scale-110' : ''}`}
              style={{ color: isLiked ? primaryColor : '#9ca3af' }}
              disabled={isGuest}
              aria-label={isLiked ? "Retirer le like" : "Aimer ce post"}
              aria-pressed={isLiked}
            >
              <Heart size={28} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
              <span className="font-black">{post.likes + (isLiked ? 1 : 0)}</span>
            </button>
            <button className="flex items-center gap-1 text-gray-600" aria-label="Commentaires">
              <MessageCircle size={28} aria-hidden="true" />
              <span className="font-black">{comments.length}</span>
            </button>
            <button className="ml-auto text-gray-600" aria-label="Partager">
              <Share2 size={28} aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm text-gray-700">
            <span className="font-bold mr-2">{post.user}</span>
            {post.caption}
          </p>

          <div className="pt-4 border-t border-pink-50 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Commentaires ({comments.length})
            </h3>
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 font-bold text-center py-4">
                Aucun commentaire. Sois le premier ! 💬
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={c.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_handle}`} />
                  <AvatarFallback>{(c.user_name || c.user_handle)[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs">{c.user_name || c.user_handle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{formatTime(c.created_at)}</span>
                        {user.handle === c.user_handle && (
                          <button
                            onClick={() => handleDeleteComment(c.id, c.user_handle)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            aria-label="Supprimer le commentaire"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{c.text}</p>
                  </div>
                  {!isGuest && (
                    <button
                      onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, name: c.user_name || c.user_handle })}
                      className="text-[10px] font-black text-gray-400 hover:text-gray-600 mt-1 ml-2 transition-colors"
                    >
                      {replyingTo?.id === c.id ? 'Annuler' : 'Répondre'}
                    </button>
                  )}
                  {/* Réponses imbriquées */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      {c.replies.map(r => (
                        <div key={r.id} className="flex gap-2">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={r.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_handle}`} />
                            <AvatarFallback>{(r.user_name || r.user_handle)[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-gray-50 p-2 rounded-xl rounded-tl-none">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-[10px]">{r.user_name || r.user_handle}</span>
                              <span className="text-[9px] text-gray-400">{formatTime(r.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-600">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-pink-50 z-30 md:max-w-2xl md:mx-auto">
        {isGuest ? (
          <div
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 p-4 rounded-2xl cursor-pointer hover:bg-gray-200 transition-colors"
            role="button"
            aria-label="Se connecter pour commenter"
          >
            <Lock size={16} aria-hidden="true" />
            <span className="text-xs font-bold uppercase">Connecte-toi pour commenter</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2">
            {replyingTo && (
              <span className="text-[10px] font-black text-pink-400 whitespace-nowrap pl-2">@{replyingTo.name}</span>
            )}
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
              placeholder={replyingTo ? `Répondre à ${replyingTo.name}...` : "Ajouter un commentaire..."}
              className="border-none bg-transparent focus-visible:ring-0 shadow-none"
              maxLength={500}
              aria-label="Écrire un commentaire"
            />
            <Button
              className={`rounded-xl transition-all ${comment.trim() ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
              style={{ backgroundColor: comment.trim() ? primaryColor : undefined }}
              size="icon"
              disabled={!comment.trim() || isSubmitting}
              onClick={handleSendComment}
              aria-label="Envoyer le commentaire"
            >
              <Send size={18} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PostDetail;
