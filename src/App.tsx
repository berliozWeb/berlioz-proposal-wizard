import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDependenciesProvider } from "@/presentation/providers/AppDependenciesProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AdminRoute from "@/components/layout/AdminRoute";
const AdminInsightsPage = lazy(() => import("./pages/AdminInsightsPage"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));
import { Navigate } from "react-router-dom";

// Pages
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
const QuotePage = lazy(() => import("./pages/QuotePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PasswordRecoveryPage = lazy(() => import("./pages/PasswordRecoveryPage"));
const NewPasswordPage = lazy(() => import("./pages/NewPasswordPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const QuotesPage = lazy(() => import("./pages/QuotesPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const OrderPaidPage = lazy(() => import("./pages/OrderPaidPage"));
const Propuesta = lazy(() => import("./pages/Propuesta"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
import ProductDetailPage from "./pages/ProductDetailPage";
const ContactoPage = lazy(() => import("./pages/ContactoPage"));
const RecompensasPublicPage = lazy(() => import("./pages/RecompensasPublicPage"));
const AdminCustomersPage = lazy(() => import("./pages/AdminCustomersPage"));
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <AppDependenciesProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<CatalogPage />} />
                <Route path="/cotizar" element={<QuotePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/recuperar-contrasena" element={<PasswordRecoveryPage />} />
                <Route path="/nueva-contrasena" element={<NewPasswordPage />} />
                <Route path="/propuesta" element={<Propuesta />} />
                <Route path="/producto/:slug" element={<ProductDetailPage />} />
                <Route path="/contacto" element={<ContactoPage />} />
                <Route path="/recompensas" element={<RecompensasPublicPage />} />
                <Route path="/carrito" element={<CartPage />} />

                {/* Auth required */}
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/pedidos" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
                <Route path="/dashboard/equipo" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
                <Route path="/dashboard/recompensas" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
                <Route path="/cotizaciones" element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/confirmacion" element={<OrderConfirmationPage />} />
                <Route path="/pedido-pagado" element={<OrderPaidPage />} />
                <Route path="/cuenta" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

                {/* Legacy */}
                <Route path="/admin-leads" element={<AdminLeads />} />
                <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/pedidos" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
                <Route path="/admin/configuracion" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
                <Route path="/admin/customers" element={<AdminRoute><AdminCustomersPage /></AdminRoute>} />
                <Route path="/admin/insights" element={<AdminRoute><AdminInsightsPage /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </BrowserRouter>
          </AppDependenciesProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;