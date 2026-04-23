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
  headerLogoUrl: string;
  homeLogoUrl: string;
  pwaIconUrl: string;
  appName: string;
  primaryColor: string;
  deliveryZones: DeliveryZone[];
  updateLogo: (url: string) => void;
  updateHeaderLogo: (url: string) => void;
  updateHomeLogo: (url: string) => void;
  updatePwaIcon: (url: string) => void;
  updateAppName: (name: string) => void;
  updatePrimaryColor: (color: string) => void;
  updateDeliveryZones: (zones: DeliveryZone[]) => void;
}

const DEFAULT_LOGO = "https://api.dicebear.com/7.x/avataaars/svg?seed=Vulture";

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [headerLogoUrl, setHeaderLogoUrl] = useState(DEFAULT_LOGO);
  const [homeLogoUrl, setHomeLogoUrl] = useState(DEFAULT_LOGO);
  const [pwaIconUrl, setPwaIconUrl] = useState('');
  const [appName, setAppName] = useState('Chibi Vulture');
  const [primaryColor, setPrimaryColor] = useState("#EC4899");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([
    { id: 'kaloum', label: 'Kaloum',  price: 15000 },
    { id: 'dixinn', label: 'Dixinn',  price: 20000 },
    { id: 'ratoma', label: 'Ratoma',  price: 25000 },
    { id: 'matam',  label: 'Matam',   price: 25000 },
    { id: 'matoto', label: 'Matoto',  price: 30000 },
    { id: 'coyah',  label: 'Coyah',   price: 50000 },
    { id: 'kindia', label: 'Kindia',  price: 80000 },
  ]);

  useEffect(() => {
    const load = async () => {
      const savedHeader = localStorage.getItem('cv_logo_header');
      const savedHome   = localStorage.getItem('cv_logo_home');
      // legacy fallback
      const savedLogo   = localStorage.getItem('cv_logo');

      if (savedHeader) setHeaderLogoUrl(savedHeader);
      else if (savedLogo) setHeaderLogoUrl(savedLogo);

      if (savedHome) setHomeLogoUrl(savedHome);
      else if (savedLogo) setHomeLogoUrl(savedLogo);

      const savedColor = localStorage.getItem('cv_color');
      if (savedColor) setPrimaryColor(savedColor);

      const savedPwaIcon = localStorage.getItem('cv_pwa_icon');
      if (savedPwaIcon) setPwaIconUrl(savedPwaIcon);

      const savedAppName = localStorage.getItem('cv_app_name');
      if (savedAppName) {
        setAppName(savedAppName);
        document.title = savedAppName;
        document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', savedAppName);
      }

      const savedZones = localStorage.getItem('cv_zones');
      if (savedZones) setDeliveryZones(JSON.parse(savedZones) as DeliveryZone[]);

      try {
        const settings = await apiService.getAppSettings();
        if (settings?.app_logo_header) setHeaderLogoUrl(settings.app_logo_header);
        else if (settings?.app_logo) setHeaderLogoUrl(settings.app_logo);

        if (settings?.app_logo_home) setHomeLogoUrl(settings.app_logo_home);
        else if (settings?.app_logo) setHomeLogoUrl(settings.app_logo);

        if (settings?.primary_color) setPrimaryColor(settings.primary_color);
        if (settings?.pwa_icon) setPwaIconUrl(settings.pwa_icon);
        if (settings?.app_name) {
          setAppName(settings.app_name);
          document.title = settings.app_name;
          document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', settings.app_name);
        }
      } catch (err) {
        console.error("Failed to fetch app settings:", err);
      }


      if (savedColor) document.documentElement.style.setProperty('--primary-theme', savedColor);
    };
    load();
  }, []);

  useEffect(() => { localStorage.setItem('cv_logo_header', headerLogoUrl); }, [headerLogoUrl]);
  useEffect(() => { localStorage.setItem('cv_logo_home', homeLogoUrl); }, [homeLogoUrl]);
  useEffect(() => {
    localStorage.setItem('cv_pwa_icon', pwaIconUrl);
    const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (link) link.href = pwaIconUrl || headerLogoUrl;
    const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (appleLink) appleLink.href = pwaIconUrl || headerLogoUrl;
  }, [pwaIconUrl, headerLogoUrl]);
  useEffect(() => {
    localStorage.setItem('cv_app_name', appName);
    document.title = appName;
    document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', appName);
  }, [appName]);
  useEffect(() => {
    localStorage.setItem('cv_color', primaryColor);
    document.documentElement.style.setProperty('--primary-theme', primaryColor);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primaryColor);
  }, [primaryColor]);
  useEffect(() => { localStorage.setItem('cv_zones', JSON.stringify(deliveryZones)); }, [deliveryZones]);

  const updateHeaderLogo    = useCallback((url: string) => setHeaderLogoUrl(url), []);
  const updateHomeLogo      = useCallback((url: string) => setHomeLogoUrl(url), []);
  const updatePwaIcon       = useCallback((url: string) => setPwaIconUrl(url), []);
  const updateAppName       = useCallback((name: string) => setAppName(name), []);
  const updateLogo          = useCallback((url: string) => { setHeaderLogoUrl(url); setHomeLogoUrl(url); }, []);
  const updatePrimaryColor  = useCallback((color: string) => setPrimaryColor(color), []);
  const updateDeliveryZones = useCallback((zones: DeliveryZone[]) => setDeliveryZones(zones), []);

  const contextValue = useMemo(() => ({
    logoUrl: headerLogoUrl,
    headerLogoUrl,
    homeLogoUrl,
    pwaIconUrl,
    appName,
    primaryColor,
    deliveryZones,
    updateLogo,
    updateHeaderLogo,
    updateHomeLogo,
    updatePwaIcon,
    updateAppName,
    updatePrimaryColor,
    updateDeliveryZones,
  }), [headerLogoUrl, homeLogoUrl, pwaIconUrl, appName, primaryColor, deliveryZones,
       updateLogo, updateHeaderLogo, updateHomeLogo, updatePwaIcon, updateAppName,
       updatePrimaryColor, updateDeliveryZones]);

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
