"use client";

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Heart, MessageCircle, UserPlus, Bell, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from '@/context/AppContext';
import { getAvatarUrl } from '@/utils/avatar';
import { apiService } from '@/services/api';

interface Notification {
  id: number;
  type: 'like' | 'follow' | 'comment' | 'announcement';
  actor_handle: string;
  actor_name: string;
  actor_avatar: string | null;
  post_id: number | null;
  post_image: string | null;
  comment_text?: string;
  extra_text?: string;
  url?: string;
  created_at: string;
}

const typeConfig = {
  like:    { icon: Heart,         color: 'text-pink-500',   bg: 'bg-pink-50',   label: 'a aimé ton post' },
  follow:  { icon: UserPlus,      color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'a commencé à te suivre' },
  comment: { icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50', label: 'a commenté' },
  announcement: { icon: Bell,      color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Annonce officielle' },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
};

const Notifications = () => {
  const { user, primaryColor } = useApp();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.isAuthenticated) {
      setIsLoading(false);
      return;
    }
    const fetchNotifs = () => {
      apiService.getNotifications()
        .then(data => { if (data) setNotifs(data); })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user.isAuthenticated]);

  return (
    <MainLayout>
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">NOTIFICATIONS</h1>
        <div className="p-2 rounded-2xl text-white" style={{ backgroundColor: primaryColor }}>
          <Bell size={20} />
        </div>
      </header>

      <div className="px-4 space-y-2 pb-24">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-3xl">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4 rounded-full" />
                  <Skeleton className="h-2 w-1/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && notifs.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Bell size={40} className="mx-auto text-gray-200" />
            <p className="text-gray-400 font-bold text-sm">Aucune notification pour le moment</p>
          </div>
        )}

        {notifs.map((notif) => {
          const cfg = typeConfig[notif.type] ?? typeConfig.like;
          const Icon = cfg.icon;
          let text = cfg.label;
          if (notif.type === 'comment' && notif.comment_text) {
            text = `a commenté : "${notif.comment_text.slice(0, 40)}${notif.comment_text.length > 40 ? '…' : ''}"`;
          } else if (notif.type === 'announcement') {
            text = notif.comment_text || cfg.label; // title
          }

          return (
            <div
              key={`${notif.type}-${notif.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-3xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-pink-50"
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                  <AvatarImage
                    src={getAvatarUrl(notif.actor_avatar, notif.actor_handle)}
                    alt={notif.actor_name}
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback>{notif.actor_name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 ${cfg.bg} ${cfg.color} p-1 rounded-full border-2 border-white`}>
                  <Icon size={12} strokeWidth={3} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-black text-gray-800">{notif.type === 'announcement' ? 'Annonce' : notif.actor_name}</span>{' '}
                  <span className="text-gray-500">{text}</span>
                </p>
                {notif.type === 'announcement' && notif.extra_text && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.extra_text}</p>
                )}
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{timeAgo(notif.created_at)}</p>
              </div>

              {notif.post_image && (
                <img
                  src={notif.post_image}
                  alt="post"
                  className="w-12 h-12 rounded-2xl object-cover flex-shrink-0"
                />
              )}
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
};

export default Notifications;
