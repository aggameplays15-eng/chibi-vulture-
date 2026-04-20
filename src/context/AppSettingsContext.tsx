"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '@/services/api';

interface DeliveryZone {
  id: string;
  label: string;
  price: number;
}

interface AppSettingsContextType {
  logoUrl: string;
  primaryColor: string;
  deliveryZones: DeliveryZone[];
  updateLogo: (url: string) => void;
  updatePrimaryColor: (color: string) => void;
  updateDeliveryZones: (zones: DeliveryZone[]) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [logoUrl, setLogoUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture");
  const [primaryColor, setPrimaryColor] = useState("#EC4899");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);

  useEffect(() => {
    const load = async () => {
      const savedLogo = localStorage.getItem('cv_logo');
      if (savedLogo) setLogoUrl(savedLogo);
      
      const savedColor = localStorage.getItem('cv_color');
      if (savedColor) setPrimaryColor(savedColor);
      
      const savedZones = localStorage.getItem('cv_zones');
      if (savedZones) setDeliveryZones(JSON.parse(savedZones) as DeliveryZone[]);

      // Fetch app settings from API
      try {
        const settings = await apiService.getAppSettings();
        if (settings) {
          if (settings.app_logo) setLogoUrl(settings.app_logo);
          if (settings.primary_color) setPrimaryColor(settings.primary_color);
        }
      } catch (err) {
        console.error("Failed to fetch app settings:", err);
      }

      // Apply primary color to document
      if (savedColor) document.documentElement.style.setProperty('--primary-theme', savedColor);
    };
    
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('cv_logo', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem('cv_color', primaryColor);
    document.documentElement.style.setProperty('--primary-theme', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('cv_zones', JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  const updateLogo = useCallback((url: string) => setLogoUrl(url), []);
  const updatePrimaryColor = useCallback((color: string) => setPrimaryColor(color), []);
  const updateDeliveryZones = useCallback((zones: DeliveryZone[]) => setDeliveryZones(zones), []);

  const contextValue = useMemo(() => ({
    logoUrl, primaryColor, deliveryZones,
    updateLogo, updatePrimaryColor, updateDeliveryZones
  }), [logoUrl, primaryColor, deliveryZones, updateLogo, updatePrimaryColor, updateDeliveryZones]);

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return context;
};
