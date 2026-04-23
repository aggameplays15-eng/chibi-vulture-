import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DataProvider } from "./context/DataContext";
import { AppSettingsProvider } from "./context/AppSettingsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MusicPlayer from "@/components/MusicPlayer";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { lazy, Suspense } from "react";

// Eager — pages critiques
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";

// Lazy — pages secondaires (réduit le bundle initial)
const Feed            = lazy(() => import("./pages/Feed"));
const Explore         = lazy(() => import("./pages/Explore"));
const Shop            = lazy(() => import("./pages/Shop"));
const Profile         = lazy(() => import("./pages/Profile"));
const PublicProfile   = lazy(() => import("./pages/PublicProfile"));
const EditProfile     = lazy(() => import("./pages/EditProfile"));
const Admin           = lazy(() => import("./pages/Admin"));
const AdminLogin      = lazy(() => import("./pages/AdminLogin"));
const CharacterCreation = lazy(() => import("./pages/CharacterCreation"));
const CreatePost      = lazy(() => import("./pages/CreatePost"));
const PostDetail      = lazy(() => import("./pages/PostDetail"));
const ProductDetail   = lazy(() => import("./pages/ProductDetail"));
const Cart            = lazy(() => import("./pages/Cart"));
const Checkout        = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const MyOrders        = lazy(() => import("./pages/MyOrders"));
const OrderDetail     = lazy(() => import("./pages/OrderDetail"));
const Notifications   = lazy(() => import("./pages/Notifications"));
const Messages        = lazy(() => import("./pages/Messages"));
const Chat            = lazy(() => import("./pages/Chat"));
const Settings        = lazy(() => import("./pages/Settings"));
const Followers       = lazy(() => import("./pages/Followers"));
const Support         = lazy(() => import("./pages/Support"));
const Terms           = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  // Pages accessibles aux invités
  const publicPages = ['/feed', '/explore', '/shop', '/post', '/product', '/support', '/terms', '/cart', '/checkout', '/checkout-success'];
  const isPublicPage = publicPages.some(path => location.pathname.startsWith(path));

  if (!user.isAuthenticated && !user.isGuest) return <Navigate to="/login" />;
  if (user.isGuest && !isPublicPage) return <Navigate to="/login" />;
  if (requireAdmin && user.role !== "Admin") return <Navigate to="/goated" />;

  // Utilisateur connecté mais pas encore approuvé → page d'attente
  if (user.isAuthenticated && !user.isGuest && !user.isApproved && user.role !== 'Admin') {
    return <Navigate to="/pending-approval" />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
  <ThemeProvider attribute="class" defaultTheme="light" storageKey="cv_theme">
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <DataProvider>
          <AppSettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin" /></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pending-approval" element={<PendingApproval />} />
                  <Route path="/goated" element={<AdminLogin />} />
                  
                  <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                  <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                  <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                  <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                  <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/profile/:handle" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
                  <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                  <Route path="/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                  <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
                  <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  
                  <Route path="/goated-panel" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                  
                  {/* Anciennes routes admin — redirigées vers 404 pour ne pas révéler l'URL réelle */}
                  <Route path="/admin" element={<NotFound />} />
                  <Route path="/admin-login" element={<NotFound />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                <MusicPlayer />
              </BrowserRouter>
            </TooltipProvider>
          </AppSettingsProvider>
        </DataProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;