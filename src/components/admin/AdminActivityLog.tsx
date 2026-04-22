"use client";

import React, { useEffect, useState } from 'react';
import { Activity, UserCheck, UserX, Trash2, Package, Bell, Settings, ShoppingBag } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  target: string;
  time: string;
  type: 'user' | 'order' | 'product' | 'notification' | 'settings' | 'moderation';
}

const ICON_MAP = {
  user:         { icon: UserCheck, color: 'text-blue-500',    bg: 'bg-blue-50'    },
  order:        { icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  product:      { icon: Package,   color: 'text-purple-500',  bg: 'bg-purple-50'  },
  notification: { icon: Bell,      color: 'text-yellow-500',  bg: 'bg-yellow-50'  },
  settings:     { icon: Settings,  color: 'text-gray-500',    bg: 'bg-gray-50'    },
  moderation:   { icon: Trash2,    color: 'text-red-500',     bg: 'bg-red-50'     },
};

const STORAGE_KEY = 'cv_admin_activity_log';
const MAX_ENTRIES = 50;

export const logAdminAction = (action: string, target: string, type: LogEntry['type']) => {
  try {
    const existing: LogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      target,
      type,
      time: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
};

const AdminActivityLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setLogs(stored);
    } catch { setLogs([]); }
  }, []);

  const clearLogs = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLogs([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-purple-500" />
          <h3 className="font-black text-gray-900 text-lg">Activité récente</h3>
        </div>
        {logs.length > 0 && (
          <button onClick={clearLogs} className="text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider">
            Effacer
          </button>
        )}
      </div>

      <div className="space-y-2">
        {logs.length === 0 && (
          <div className="text-center py-8">
            <Activity size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-xs text-gray-400 font-bold">Aucune activité enregistrée.</p>
          </div>
        )}
        {logs.map(log => {
          const cfg = ICON_MAP[log.type];
          const Icon = cfg.icon;
          return (
            <div key={log.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-gray-50 shadow-sm">
              <div className={`${cfg.bg} p-2 rounded-xl flex-shrink-0`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-800">{log.action}</p>
                <p className="text-[10px] text-gray-400 font-bold truncate">{log.target}</p>
              </div>
              <span className="text-[9px] font-black text-gray-300 flex-shrink-0">{log.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActivityLog;
