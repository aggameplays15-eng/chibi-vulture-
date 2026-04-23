"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { ChevronLeft, Send, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { getAvatarUrl } from '@/utils/avatar';
import { apiService } from '@/services/api';

interface ChatMessage {
  id: number;
  sender_handle: string;
  receiver_handle: string;
  text: string;
  created_at: string;
  optimistic?: boolean;
}

const Chat = () => {
  const navigate = useNavigate();
  const { id: otherHandle } = useParams<{ id: string }>();
  const { user, users, primaryColor } = useApp();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);

  // Trouver le nom réel de l'interlocuteur
  const otherUser = users.find(u => u.handle === otherHandle || u.handle === `@${otherHandle}`);
  const otherName = otherUser?.name || otherHandle || 'Utilisateur';
  const otherAvatar = getAvatarUrl(otherUser?.avatarImage, otherHandle);

  const fetchMessages = useCallback(async () => {
    if (!user.handle || !otherHandle) return;
    try {
      const data = await apiService.getMessages(user.handle, otherHandle);
      if (data && data.length !== lastCountRef.current) {
        lastCountRef.current = data.length;
        setChatMessages(data.filter((m: ChatMessage) => !m.optimistic));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user.handle, otherHandle]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll uniquement si on est déjà en bas
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !user.handle || !otherHandle) return;
    setMessage('');

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      sender_handle: user.handle,
      receiver_handle: otherHandle,
      text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      await apiService.sendMessage({ sender_handle: user.handle, receiver_handle: otherHandle, text });
      fetchMessages();
    } catch (err) {
      console.error(err);
      // Retirer le message optimiste en cas d'erreur
      setChatMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <MainLayout>
      <header className="p-4 flex items-center gap-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-10 h-10 border-2 border-pink-100">
            <AvatarImage src={otherAvatar} alt={otherName} />
            <AvatarFallback>{otherName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-black text-sm text-gray-800">{otherName}</h3>
            <p className="text-[10px] font-bold uppercase" style={{ color: primaryColor }}>
              {otherHandle?.startsWith('@') ? otherHandle : `@${otherHandle}`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical size={20} className="text-gray-400" />
        </Button>
      </header>

      <div ref={scrollRef} className="p-6 space-y-4 h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
        {chatMessages.map((msg) => {
          const isSent = msg.sender_handle === user.handle;
          return (
            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-opacity ${
                  isSent
                    ? 'text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                } ${msg.optimistic ? 'opacity-60' : 'opacity-100'}`}
                style={isSent ? { backgroundColor: primaryColor } : undefined}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris ton message..."
            className="border-none bg-transparent focus-visible:ring-0 shadow-none"
          />
          <Button
            className="rounded-xl transition-all"
            style={{ backgroundColor: message ? primaryColor : undefined }}
            size="icon"
            disabled={!message.trim()}
            onClick={handleSend}
            aria-label="Envoyer"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
