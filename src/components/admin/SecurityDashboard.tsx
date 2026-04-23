"use client";

import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Globe, Clock, MapPin, Filter, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from '@/services/api';

interface SecurityLog {
  id: number;
  ip: string;
  threat_type: string;
  detail: string;
  path: string;
  method: string;
  user_agent: string;
  created_at: string;
}

interface SecurityStats {
  threat_type: string;
  count: number;
  unique_ips: number;
}

const SecurityDashboard = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<SecurityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [ipLocation, setIpLocation] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSecurityLogs();
  }, [filter]);

  const fetchSecurityLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security-logs' + (filter !== 'all' ? `?type=${filter}` : ''), {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('cv_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || []);
        
        // Fetch IP locations for unique IPs
        const uniqueIps = [...new Set(data.logs?.map((log: SecurityLog) => log.ip) || [])] as string[];
        fetchIpLocations(uniqueIps.slice(0, 20)); // Limit to 20 IPs to avoid rate limits
      }
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIpLocations = async (ips: string[]) => {
    const locations: Record<string, any> = {};
    for (const ip of ips) {
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        if (res.ok) {
          const data = await res.json();
          locations[ip] = {
            country: data.country,
            city: data.city,
            isp: data.isp,
            lat: data.lat,
            lon: data.lon,
          };
        }
      } catch {
        // Fail silently
      }
    }
    setIpLocation(locations);
  };

  const getThreatColor = (type: string) => {
    const colors: Record<string, string> = {
      'BLOCKED_UA': 'bg-red-500',
      'HONEYPOT': 'bg-purple-500',
      'MALICIOUS_PAYLOAD': 'bg-orange-500',
      'DOS_FLOOD': 'bg-red-600',
      'DDOS_SUSTAINED': 'bg-red-700',
      'SCAN_DETECTED': 'bg-yellow-500',
      'FUZZING_DETECTED': 'bg-orange-600',
      'AUTH_FAILURE': 'bg-yellow-600',
      'NOT_FOUND': 'bg-gray-500',
      'ADMIN_RATE_LIMIT': 'bg-blue-500',
      'INVALID_METHOD': 'bg-pink-500',
      'LARGE_PAYLOAD': 'bg-pink-600',
    };
    return colors[type] || 'bg-gray-500';
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.threat_type === filter);
  const threatTypes = [...new Set(stats.map(s => s.threat_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              Menaces totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-900">{stats.reduce((sum, s) => sum + s.count, 0)}</div>
            <div className="text-xs text-red-600 mt-1">30 derniers jours</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Globe size={16} />
              IPs uniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-900">{stats.reduce((sum, s) => sum + s.unique_ips, 0)}</div>
            <div className="text-xs text-orange-600 mt-1">Attaquants distincts</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Shield size={16} />
              Honeypot hits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-900">
              {stats.find(s => s.threat_type === 'HONEYPOT')?.count || 0}
            </div>
            <div className="text-xs text-purple-600 mt-1">Tentatives de scan</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Clock size={16} />
              Dernière attaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black text-blue-900">
              {logs.length > 0 ? new Date(logs[0].created_at).toLocaleString('fr-FR') : '-'}
            </div>
            <div className="text-xs text-blue-600 mt-1">Plus récent</div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-black">Distribution des menaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.map((stat) => {
              const maxCount = Math.max(...stats.map(s => s.count));
              const percentage = (stat.count / maxCount) * 100;
              return (
                <div key={stat.threat_type} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-gray-600">{stat.threat_type}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${getThreatColor(stat.threat_type)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm font-bold text-gray-900">{stat.count}</div>
                  <div className="w-16 text-right text-xs text-gray-500">{stat.unique_ips} IPs</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black">Journal des attaques</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="text-sm border rounded-lg px-3 py-1.5"
                >
                  <option value="all">Tous les types</option>
                  {threatTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchSecurityLogs()}>
                <Download size={16} className="mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Aucune menace détectée</div>
            ) : (
              filteredLogs.map((log) => {
                const location = ipLocation[log.ip];
                return (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getThreatColor(log.threat_type)}>
                            {log.threat_type}
                          </Badge>
                          <span className="text-xs text-gray-500">{log.method} {log.path}</span>
                        </div>
                        <div className="text-sm text-gray-600">{log.detail}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="font-mono">{log.ip}</span>
                          {location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {location.city}, {location.country}
                            </span>
                          )}
                          {location?.isp && <span>{location.isp}</span>}
                          <span>{new Date(log.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-md">
                          UA: {log.user_agent}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
