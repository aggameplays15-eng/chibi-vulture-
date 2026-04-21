"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Search, Edit, Loader2, MessageCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { apiService } from '@/services/api';

interface Conversation {
  other_handle: string;
  other_name: string;
  other_avatar: string | null;
  last_msg: string;
  last_time: string;
  unread_count: number;
}

const timeLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const Messages = () => {
  const navigate = useNavigate();
  const { user, primaryColor } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.isAuthenticated) { setIsLoading(false); return; }
    apiService.getConversations()
      .then(data => { if (data) setConversations(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user.isAuthenticated]);

  const filtered = conversations.filter(c =>
    c.other_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.other_handle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-800">MESSAGES</h1>
        <button
          className="p-2 rounded-2xl text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: primaryColor }}
          aria-label="Nouveau message"
        >
          <Edit size={20} />
        </button>
      </header>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-2xl border-gray-100 bg-gray-50/50"
            placeholder="Rechercher une discussion..."
          />
        </div>
      </div>

      <div className="px-4 space-y-2 pb-24">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-gray-300" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <MessageCircle size={40} className="mx-auto text-gray-200" />
            <p className="text-gray-400 font-bold text-sm">Aucune conversation</p>
          </div>
        )}

        {filtered.map((conv) => (
          <div
            key={conv.other_handle}
            onClick={() => navigate(`/chat/${conv.other_handle}`)}
            className="flex items-center gap-4 p-4 bg-white rounded-3xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-pink-50"
          >
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                <AvatarImage
                  src={conv.other_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_handle}`}
                  alt={conv.other_name}
                />
                <AvatarFallback>{conv.other_name?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-gray-800 truncate">{conv.other_name}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase flex-shrink-0 ml-2">
                  {conv.last_time ? timeLabel(conv.last_time) : ''}
                </span>
              </div>
              <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                {conv.last_msg}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <div
                className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {conv.unread_count}
              </div>
            )}
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default Messages;
