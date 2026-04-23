"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';

interface UserProfile {
  id: number;
  name: string;
  handle: string;
  email?: string;
  bio: string;
  avatarColor: string;
  avatarImage?: string;
  avatar_image?: string;
  role: 'Member' | 'Admin';
  isApproved: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  status: 'Actif' | 'Signalé' | 'Banni';
  following: string[];
}

interface AuthContextType {
  user: UserProfile;
  users: UserProfile[];
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ needsOnboarding?: boolean }>;
  signup: (userData: any) => Promise<{ needsOnboarding?: boolean }>;
  adminLogin: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  approveUser: (id: number) => void;
  banUser: (id: number) => void;
  toggleFollow: (handle: string) => void;
  setGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: 0, name: "", handle: "", bio: "", avatarColor: "#94a3b8", role: 'Member', isApproved: false, isAuthenticated: false, isGuest: false, status: 'Actif', following: []
  });
  const [users, setUsers] = useState<UserProfile[]>([]);

  const normalizeUser = useCallback((u: any): UserProfile => ({
    ...u,
    avatarImage: u.avatar_image || u.avatarImage,
    isApproved: u.is_approved ?? u.isApproved ?? false,
    following: u.following || [],
    isAuthenticated: u.isAuthenticated ?? false,
    isGuest: u.isGuest ?? false
  }), []);

  useEffect(() => {
    const load = async () => {
      const savedUser = localStorage.getItem('cv_user');
      if (savedUser) setUser(normalizeUser(JSON.parse(savedUser)));

      const savedUsers = localStorage.getItem('cv_users_list');
      if (savedUsers) {
        const list = JSON.parse(savedUsers) as UserProfile[];
        setUsers(list.map(normalizeUser));
      }

      const savedToken = localStorage.getItem('cv_token');
      if (savedToken) {
        setToken(savedToken);
        apiService.setToken(savedToken);
      }

      try {
        const realUsers = await apiService.getUsers();
        if (realUsers && Array.isArray(realUsers)) {
          setUsers(realUsers.map(normalizeUser));
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }

      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_user', JSON.stringify(user));
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('cv_users_list', JSON.stringify(users));
  }, [users, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('cv_token', token);
      else localStorage.removeItem('cv_token');
    }
  }, [token, isLoading]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiService.login(credentials);
      setToken(data.token);
      apiService.setToken(data.token);
      const loggedUser = normalizeUser({ ...data.user, isAuthenticated: true, isGuest: false });
      setUser(loggedUser);
      return {};
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  }, []);

  const signup = useCallback(async (userData: any) => {
    try {
      const data = await apiService.signup(userData);
      
      // Si le backend renvoie un token (connexion auto), on l'utilise
      if (data.token) {
        setToken(data.token);
        apiService.setToken(data.token);
        const loggedUser = normalizeUser({ ...data.user, isAuthenticated: true, isGuest: false });
        setUser(loggedUser);
      }
      
      return {};
    } catch (err) {
      console.error("Signup failed:", err);
      throw err;
    }
  }, []);

  const adminLogin = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiService.adminLogin(credentials);
      setToken(data.token);
      apiService.setToken(data.token);
      const adminUser = normalizeUser({ ...data.user, isAuthenticated: true, isGuest: false });
      setUser(adminUser);
    } catch (err) {
      console.error("Admin login failed:", err);
      throw err;
    }
  }, []);



  const setGuestMode = useCallback(() => {
    setToken(null);
    setUser({ id: -1, name: "Visiteur", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Member', isApproved: true, isAuthenticated: false, isGuest: true, status: 'Actif', following: [] });
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setToken(null);
    setUser({ id: 0, name: "", handle: "", bio: "", avatarColor: "#94a3b8", role: 'Member', isApproved: false, isAuthenticated: false, isGuest: false, status: 'Actif', following: [] });
  }, []);

  const updateUser = useCallback(async (data: Partial<UserProfile>) => {
    try {
      if (user.id) {
        const response = await apiService.updateUser({ id: user.id, ...data });
        const normalizedData = normalizeUser({ ...user, ...data });
        setUser(normalizedData);
        // Update in the global users list too
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...normalizedData } : u));
      }
    } catch (err) { console.error(err); }
  }, [user.id]);

  const approveUser = useCallback(async (id: number) => {
    try {
      await apiService.updateUser({ id, is_approved: true });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
    } catch (err) { console.error(err); }
  }, []);

  const banUser = useCallback(async (id: number) => {
    try {
      await apiService.updateUser({ id, status: 'Banni' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Banni' } : u));
    } catch (err) { console.error(err); }
  }, []);

  const toggleFollow = useCallback(async (handle: string) => {
    if (user.isGuest || !user.isAuthenticated) return;
    try {
      await apiService.toggleFollow(user.handle, handle);
      setUser(prev => {
        const currentFollowing = prev.following || [];
        const isFollowing = currentFollowing.includes(handle);
        return {
          ...prev,
          following: isFollowing 
            ? currentFollowing.filter(h => h !== handle) 
            : [...currentFollowing, handle]
        };
      });
    } catch (err) { console.error(err); }
  }, [user.isGuest, user.isAuthenticated, user.handle]);

  const contextValue = useMemo(() => ({
    user, users, isLoading,
    login, signup, adminLogin, logout, setGuestMode,
    updateUser, approveUser, banUser, toggleFollow
  }), [
    user, users, isLoading,
    login, signup, adminLogin, logout, setGuestMode,
    updateUser, approveUser, banUser, toggleFollow
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
