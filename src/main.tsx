import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Restaurer le thème dark/light au démarrage
const savedTheme = localStorage.getItem('cv_theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
