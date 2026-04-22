import { useContext } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useData } from './DataContext';
import { useAppSettings } from './AppSettingsContext';

// Backward compatibility hook that aggregates all separate contexts
export const useApp = () => {
  const auth = useAuth();
  const cart = useCart();
  const data = useData();
  const settings = useAppSettings();

  return {
    // From AuthContext
    user: auth.user,
    users: auth.users,
    isLoading: auth.isLoading,
    login: auth.login,
    adminLogin: auth.adminLogin,
    logout: auth.logout,
    setGuestMode: auth.setGuestMode,
    updateUser: auth.updateUser,
    approveUser: auth.approveUser,
    banUser: auth.banUser,
    toggleFollow: auth.toggleFollow,
    
    // From CartContext
    cart: cart.cart,
    addToCart: cart.addToCart,
    removeFromCart: cart.removeFromCart,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    
    // From DataContext
    products: data.products,
    posts: data.posts,
    orders: data.orders,
    likedPosts: data.likedPosts,
    favoritePosts: data.favoritePosts,
    favoriteProducts: data.favoriteProducts,
    addProduct: data.addProduct,
    updateProduct: data.updateProduct,
    deleteProduct: data.deleteProduct,
    deletePost: data.deletePost,
    addOrder: data.addOrder,
    toggleLike: data.toggleLike,
    toggleFavoritePost: data.toggleFavoritePost,
    toggleFavoriteProduct: data.toggleFavoriteProduct,
    
    // From AppSettingsContext
    logoUrl: settings.logoUrl,
    headerLogoUrl: settings.headerLogoUrl,
    homeLogoUrl: settings.homeLogoUrl,
    primaryColor: settings.primaryColor,
    deliveryZones: settings.deliveryZones,
    updateLogo: settings.updateLogo,
    updateHeaderLogo: settings.updateHeaderLogo,
    updateHomeLogo: settings.updateHomeLogo,
    updatePrimaryColor: settings.updatePrimaryColor,
    updateDeliveryZones: settings.updateDeliveryZones,
  };
};
