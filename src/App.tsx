import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DataProvider } from "./context/DataContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MusicPlayer from "@/components/MusicPlayer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import CharacterCreation from "./pages/CharacterCreation";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Followers from "./pages/Followers";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Attendre que le contexte soit chargé avant de rediriger
  if (isLoading) return null;

  const publicPages = ['/feed', '/explore', '/shop', '/post', '/product', '/support', '/terms', '/cart', '/checkout', '/checkout-success'];
  const isPublicPage = publicPages.some(path => location.pathname.startsWith(path));

  if (!user.isAuthenticated && !user.isGuest) return <Navigate to="/login" />;
  if (user.isGuest && !isPublicPage) return <Navigate to="/login" />;
  if (!user.isApproved && !user.isGuest && user.role !== "Admin") return <Navigate to="/signup" />;
  if (requireAdmin && user.role !== "Admin") return <Navigate to="/goated" />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <DataProvider>
          <AppSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/goated" element={<AdminLogin />} />
                  
                  <Route path="/onboarding" element={<ProtectedRoute><CharacterCreation /></ProtectedRoute>} />
                  <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                  <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                  <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                  <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                  <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                  <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
                  <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MusicPlayer />
              </BrowserRouter>
            </TooltipProvider>
          </AppSettingsProvider>
        </DataProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;