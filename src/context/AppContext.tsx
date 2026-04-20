// DEPRECATED: This file is kept for backward compatibility only
// All functionality has been moved to separate contexts:
// - AuthContext (authentication, users)
// - CartContext (shopping cart)
// - DataContext (posts, products, orders)
// - AppSettingsContext (app settings, logo, theme)

// Re-export the new contexts for backward compatibility
export { AuthProvider, useAuth } from './AuthContext';
export { CartProvider, useCart } from './CartContext';
export { DataProvider, useData } from './DataContext';
export { AppSettingsProvider, useAppSettings } from './AppSettingsContext';

// Re-export the compatibility hook
export { useApp } from './useApp';

// Legacy exports for direct imports (will be removed in future)
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // This is a no-op provider - the real providers are now in App.tsx
  return <>{children}</>;
};