// Edge Config non disponible en free - utiliser fallback local
// import { get } from '@vercel/edge-config';

// Configuration Edge Config pour la synchronisation en temps réel
export interface EdgeConfigData {
  messages: {
    [key: string]: {
      lastUpdate: number;
      unreadCount: number;
    };
  };
  onlineUsers: string[];
  maintenanceMode: boolean;
}

// Fallback local pour les comptes free
let localConfig: EdgeConfigData = {
  messages: {},
  onlineUsers: [],
  maintenanceMode: false,
};

export const getEdgeConfig = async (): Promise<EdgeConfigData> => {
  // Edge Config non disponible en free - utiliser localStorage comme fallback
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('edge_config_fallback');
      if (stored) {
        localConfig = JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error('Edge Config Fallback Error:', error);
  }
  return localConfig;
};

export const updateOnlineStatus = async (handle: string, online: boolean) => {
  try {
    const config = await getEdgeConfig();
    if (online) {
      if (!config.onlineUsers.includes(handle)) {
        config.onlineUsers.push(handle);
      }
    } else {
      config.onlineUsers = config.onlineUsers.filter(h => h !== handle);
    }
    // Sauvegarder dans localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('edge_config_fallback', JSON.stringify(config));
    }
  } catch (error) {
    console.error('Update Online Status Error:', error);
  }
};

export const getUnreadCount = async (handle: string): Promise<number> => {
  try {
    const config = await getEdgeConfig();
    return config.messages[handle]?.unreadCount || 0;
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return 0;
  }
};
