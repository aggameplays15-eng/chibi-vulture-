import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import "./globals.css";

// Gestion des erreurs de chargement de modules (après déploiement Vercel)
window.addEventListener('error', (e) => {
  if (e.message.includes('Failed to fetch dynamically imported module') || e.message.includes('ChunkLoadError')) {
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('Failed to fetch dynamically imported module') || e.reason?.name === 'ChunkLoadError') {
    window.location.reload();
  }
});

// Restaurer le thème dark/light au démarrage
const savedTheme = localStorage.getItem('cv_theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <Analytics />
    <SpeedInsights />
  </ErrorBoundary>
);
