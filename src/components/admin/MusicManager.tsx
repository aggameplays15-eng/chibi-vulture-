"use client";

import React, { useState, useEffect } from 'react';
import { Music, Plus, Trash2, X, GripVertical, Eye, EyeOff, Youtube } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from '@/context/AppContext';
import { showSuccess, showError } from '@/utils/toast';

interface Track {
  id: number;
  title: string;
  artist: string;
  youtube_url: string;
  youtube_id: string;
  is_active: boolean;
  sort_order: number;
}

const MusicManager = () => {
  const { primaryColor } = useApp();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadTracks(); }, []);

  const loadTracks = async () => {
    try {
      const token = sessionStorage.getItem('cv_token');
      // Admin gets all tracks (active + inactive) — use same endpoint, filter client-side
      const res = await fetch('/api/music', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTracks(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeUrl.trim()) {
      showError('Titre et lien YouTube requis');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('cv_token');
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: title.trim(), artist: artist.trim(), youtube_url: youtubeUrl.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        showError(err.error || 'Erreur lors de l\'ajout');
        return;
      }
      const track = await res.json();
      setTracks(prev => [...prev, track]);
      setTitle(''); setArtist(''); setYoutubeUrl('');
      setShowForm(false);
      showSuccess('Musique ajoutée ! 🎵');
    } catch { showError('Erreur réseau'); }
    finally { setIsSubmitting(false); }
  };

  const toggleActive = async (track: Track) => {
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch('/api/music', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: track.id, is_active: !track.is_active })
      });
      if (res.ok) {
        setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_active: !t.is_active } : t));
        showSuccess(track.is_active ? 'Musique désactivée' : 'Musique activée 🎵');
      }
    } catch { showError('Erreur'); }
  };

  const handleDelete = async (id: number) => {
    const token = sessionStorage.getItem('cv_token');
    try {
      const res = await fetch(`/api/music?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== id));
        showSuccess('Musique supprimée');
      }
    } catch { showError('Erreur'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-gray-900 text-lg">Playlist</h3>
          <p className="text-xs text-gray-400 font-bold uppercase">{tracks.length} musique(s) · jouée automatiquement</p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="rounded-2xl gap-2 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={18} /> Ajouter
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border border-pink-100 rounded-[28px] shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Youtube size={18} className="text-red-500" />
                <h4 className="font-black text-gray-900">Nouvelle musique</h4>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 rounded-xl">
                <X size={16} />
              </Button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Titre *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Lofi Hip Hop" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Artiste</Label>
                <Input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Ex: ChilledCow" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lien YouTube *</Label>
                <Input
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-11 rounded-xl"
                />
                <p className="text-[10px] text-gray-400">Formats acceptés : youtube.com/watch?v=, youtu.be/, ou ID direct</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl h-11">Annuler</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl h-11 text-white font-black" style={{ backgroundColor: primaryColor }}>
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Track list */}
      <div className="space-y-3">
        {tracks.map(track => (
          <div key={track.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3 transition-all ${track.is_active ? 'border-gray-50' : 'border-gray-100 opacity-60'}`}>
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={`https://img.youtube.com/vi/${track.youtube_id}/mqdefault.jpg`}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900 truncate">{track.title}</p>
              {track.artist && <p className="text-xs text-gray-400 font-medium truncate">{track.artist}</p>}
              <a
                href={track.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-red-400 font-bold hover:underline"
              >
                ▶ YouTube
              </a>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={track.is_active}
                onCheckedChange={() => toggleActive(track)}
                title={track.is_active ? 'Désactiver' : 'Activer'}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(track.id)}
                className="h-8 w-8 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
        {tracks.length === 0 && (
          <div className="text-center py-10 text-gray-300">
            <Music size={36} className="mx-auto mb-2" />
            <p className="text-sm font-bold">Aucune musique dans la playlist</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicManager;
