"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, BellRing, AlertCircle, CheckCircle2, Loader2, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiService } from '@/services/api';
import { showSuccess, showError } from '@/utils/toast';
import { useApp } from '@/context/AppContext';

interface PushStats {
  configured: boolean;
  stats: {
    totalSubscriptions: number;
    uniqueUsers: number;
    usersEnabled: number;
    usersDisabled: number;
  };
  recentSubscriptions: { date: string; count: number }[];
}

const PushNotificationManager = () => {
  const { primaryColor } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PushStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await apiService.getPushStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load push stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      showError('Veuillez remplir le titre et le message');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.sendPushNotification({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || '/',
      });

      showSuccess(`Notification envoyée à ${result.sent} utilisateurs ! 📱`);
      
      // Reset form
      setTitle('');
      setBody('');
      setUrl('/');
      
      // Reload stats
      loadStats();
    } catch (error) {
      showError('Erreur lors de l\'envoi de la notification');
    } finally {
      setIsLoading(false);
    }
  };

  const getEnabledPercentage = () => {
    if (!stats) return 0;
    const total = stats.stats.usersEnabled + stats.stats.usersDisabled;
    return total > 0 ? Math.round((stats.stats.usersEnabled / total) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Statistiques Push</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Vue d'ensemble des abonnements</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${primaryColor}20` }}>
                  <BellRing size={20} style={{ color: primaryColor }} />
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Abonnés</span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {isStatsLoading ? <Loader2 className="animate-spin" size={24} /> : stats?.stats.uniqueUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <Users size={20} className="text-emerald-500" />
                </div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Actifs</span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {isStatsLoading ? <Loader2 className="animate-spin" size={24} /> : `${getEnabledPercentage()}%`}
              </p>
            </CardContent>
          </Card>
        </div>

        {!isStatsLoading && stats && !stats.configured && (
          <Card className="border-none shadow-sm rounded-[28px] overflow-hidden bg-amber-50">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={24} />
              <div>
                <p className="font-bold text-amber-700">VAPID non configuré</p>
                <p className="text-xs text-amber-600">Les notifications push ne fonctionneront pas sans les clés VAPID</p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Send Notification Section */}
      <section className="space-y-4">
        <div className="px-2">
          <h3 className="font-black text-gray-900 text-lg">Envoyer une notification</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">Broadcast à tous les abonnés</p>
        </div>

        <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                Titre de la notification
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouvelle mise à jour disponible !"
                className="h-12 rounded-2xl border-gray-100 focus-visible:ring-2"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                maxLength={50}
              />
              <p className="text-[10px] text-gray-400 text-right">{title.length}/50</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                Message
              </Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ex: Découvrez les nouvelles fonctionnalités de Chibi Vulture..."
                className="min-h-[100px] rounded-2xl border-gray-100 focus-visible:ring-2 resize-none"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                maxLength={150}
              />
              <p className="text-[10px] text-gray-400 text-right">{body.length}/150</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
                Lien au clic (URL)
              </Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/feed ou https://..."
                className="h-12 rounded-2xl border-gray-100 focus-visible:ring-2"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>

            <Button
              onClick={handleSendNotification}
              disabled={isLoading || !title.trim() || !body.trim()}
              className="w-full h-14 rounded-2xl font-black text-lg gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  ENVOI EN COURS...
                </>
              ) : (
                <>
                  <Send size={20} />
                  ENVOYER LA NOTIFICATION
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Preview Card */}
      {title && body && (
        <section className="space-y-4">
          <div className="px-2">
            <h3 className="font-black text-gray-900 text-lg">Aperçu</h3>
            <p className="text-xs text-gray-400 font-bold uppercase">Rendu sur mobile</p>
          </div>

          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-gray-900">
            <CardContent className="p-6">
              <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <Bell size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{title || 'Titre'}</p>
                    <p className="text-xs text-gray-400">Chibi Vulture</p>
                  </div>
                  <span className="text-[10px] text-gray-500">maintenant</span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{body || 'Message de la notification...'}</p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default PushNotificationManager;
