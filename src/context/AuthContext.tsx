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
  role: 'Guest' | 'Member' | 'Artiste' | 'Admin';
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
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  adminLogin: (credentials: { email: string; password: string }) => Promise<{ otpRequired: boolean }>;
  adminVerifyOtp: (code: string) => Promise<boolean>;
  setGuestMode: () => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  approveUser: (id: number) => void;
  banUser: (id: number) => void;
  toggleFollow: (handle: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>({
    id: 0, name: "Invité", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Guest', isApproved: false, isAuthenticated: false, isGuest: true, status: 'Actif', following: []
  });
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const load = async () => {
      const savedUser = sessionStorage.getItem('cv_user');
      if (savedUser) setUser(JSON.parse(savedUser) as UserProfile);

      const savedUsers = sessionStorage.getItem('cv_users_list');
      if (savedUsers) setUsers(JSON.parse(savedUsers) as UserProfile[]);

      const savedToken = sessionStorage.getItem('cv_token');
      if (savedToken) {
        setToken(savedToken);
        apiService.setToken(savedToken);
      }

      const currentUser = savedUser ? JSON.parse(savedUser) : null;
      const isAdmin = currentUser?.role === 'Admin';

      if (isAdmin) {
        try {
          const realUsers = await apiService.getUsers();
          if (realUsers) setUsers(realUsers as UserProfile[]);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      }

      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoading) sessionStorage.setItem('cv_user', JSON.stringify(user));
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading) sessionStorage.setItem('cv_users_list', JSON.stringify(users));
  }, [users, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (token) sessionStorage.setItem('cv_token', token);
      else sessionStorage.removeItem('cv_token');
    }
  }, [token, isLoading]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const data = await apiService.login(credentials);
      setToken(data.token);
      apiService.setToken(data.token);
      setUser({ ...data.user, isAuthenticated: true, isGuest: false, following: data.user.following || [] });
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  }, []);

  const adminLogin = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      await apiService.adminLogin(credentials);
      return { otpRequired: true };
    } catch (err) {
      console.error("Admin login failed:", err);
      throw err;
    }
  }, []);

  const adminVerifyOtp = useCallback(async (code: string) => {
    try {
      const data = await apiService.adminVerifyOtp(code);
      setToken(data.token);
      apiService.setToken(data.token);
      setUser({ ...data.user, isAuthenticated: true, isGuest: false, following: data.user.following || [] });
      return true;
    } catch (err) {
      console.error("Admin OTP verify failed:", err);
      return false;
    }
  }, []);

  const setGuestMode = useCallback(() => {
    setUser({ id: -1, name: "Visiteur", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Guest', isApproved: true, isAuthenticated: false, isGuest: true, status: 'Actif', following: [] });
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setToken(null);
    setUser({ id: 0, name: "Invité", handle: "@guest", bio: "", avatarColor: "#94a3b8", role: 'Guest', isApproved: false, isAuthenticated: false, isGuest: true, status: 'Actif', following: [] });
  }, []);

  const updateUser = useCallback(async (data: Partial<UserProfile>) => {
    try {
      if (user.id) await apiService.updateUser({ id: user.id, ...data });
      setUser(prev => ({ ...prev, ...data }));
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
    if (user.isGuest) return;
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
  }, [user.isGuest, user.handle]);

  const contextValue = useMemo(() => ({
    user, users, isLoading,
    login, adminLogin, adminVerifyOtp, setGuestMode, logout,
    updateUser, approveUser, banUser, toggleFollow
  }), [
    user, users, isLoading,
    login, adminLogin, adminVerifyOtp, setGuestMode, logout,
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
