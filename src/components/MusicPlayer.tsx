"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, X, SkipForward, SkipBack, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  title: string;
  artist: string;
  youtube_id: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const MusicPlayer = () => {
  const { user, primaryColor } = useApp();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show for authenticated non-guest users
  const shouldShow = user.isAuthenticated && !user.isGuest && tracks.length > 0 && !isDismissed;

  // Load playlist
  useEffect(() => {
    if (!user.isAuthenticated || user.isGuest) return;
    fetch('/api/music')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setTracks(data); })
      .catch(() => {});
  }, [user.isAuthenticated, user.isGuest]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!shouldShow) return;
    if (window.YT && window.YT.Player) { setYtReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
  }, [shouldShow]);

  // Init player when ready
  useEffect(() => {
    if (!ytReady || !shouldShow || tracks.length === 0) return;
    if (playerRef.current) {
      playerRef.current.loadVideoById(tracks[currentIndex].youtube_id);
      return;
    }
    playerRef.current = new window.YT.Player('yt-player', {
      height: '0',
      width: '0',
      videoId: tracks[currentIndex].youtube_id,
      playerVars: { autoplay: 1, controls: 0, loop: 0 },
      events: {
        onReady: (e: any) => { e.target.playVideo(); setIsPlaying(true); },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          if (e.data === window.YT.PlayerState.ENDED) handleNext();
        }
      }
    });
  }, [ytReady, shouldShow, tracks]);

  const handleNext = useCallback(() => {
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    playerRef.current?.loadVideoById(tracks[next].youtube_id);
    setIsPlaying(true);
  }, [currentIndex, tracks]);

  const handlePrev = useCallback(() => {
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prev);
    playerRef.current?.loadVideoById(tracks[prev].youtube_id);
    setIsPlaying(true);
  }, [currentIndex, tracks]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) { playerRef.current.pauseVideo(); }
    else { playerRef.current.playVideo(); }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
    else { playerRef.current.mute(); setIsMuted(true); }
  };

  const selectTrack = (index: number) => {
    setCurrentIndex(index);
    playerRef.current?.loadVideoById(tracks[index].youtube_id);
    setIsPlaying(true);
  };

  if (!shouldShow) return null;

  const current = tracks[currentIndex];

  return (
    <>
      {/* Hidden YT player */}
      <div id="yt-player" className="hidden" ref={containerRef} />

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-20 right-4 z-[200] w-72 select-none"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
              onClick={() => setIsExpanded(v => !v)}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img
                  src={`https://img.youtube.com/vi/${current.youtube_id}/mqdefault.jpg`}
                  alt={current.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{current.title}</p>
                {current.artist && <p className="text-[10px] text-gray-400 truncate">{current.artist}</p>}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: primaryColor }}>
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
                <button onClick={e => { e.stopPropagation(); handleNext(); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-400">
                  <SkipForward size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); setIsDismissed(true); }} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Expanded playlist */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-1 max-h-52 overflow-y-auto">
                    {/* Extra controls row */}
                    <div className="flex items-center justify-between py-2 px-1">
                      <button onClick={handlePrev} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 font-bold transition-colors">
                        <SkipBack size={12} /> Précédent
                      </button>
                      <button onClick={toggleMute} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 font-bold transition-colors">
                        {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        {isMuted ? 'Son coupé' : 'Son actif'}
                      </button>
                    </div>
                    <div className="h-px bg-gray-100 mb-2" />
                    {tracks.map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => selectTrack(i)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all",
                          i === currentIndex ? "bg-pink-50" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={`https://img.youtube.com/vi/${t.youtube_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold truncate", i === currentIndex ? "text-pink-600" : "text-gray-700")} style={i === currentIndex ? { color: primaryColor } : {}}>
                            {t.title}
                          </p>
                          {t.artist && <p className="text-[10px] text-gray-400 truncate">{t.artist}</p>}
                        </div>
                        {i === currentIndex && isPlaying && (
                          <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
                            {[1, 2, 3].map(b => (
                              <div key={b} className="w-1 rounded-full animate-bounce" style={{ backgroundColor: primaryColor, height: `${8 + b * 3}px`, animationDelay: `${b * 0.1}s` }} />
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expand toggle */}
            <button
              onClick={() => setIsExpanded(v => !v)}
              className="w-full flex items-center justify-center py-1.5 text-gray-300 hover:text-gray-500 transition-colors border-t border-gray-50"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default MusicPlayer;
