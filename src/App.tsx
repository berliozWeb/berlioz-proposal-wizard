import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDependenciesProvider } from "@/presentation/providers/AppDependenciesProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import QuotePage from "./pages/QuotePage";
import LoginPage from "./pages/LoginPage";
import PasswordRecoveryPage from "./pages/PasswordRecoveryPage";
import NewPasswordPage from "./pages/NewPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import TeamPage from "./pages/TeamPage";
import RewardsPage from "./pages/RewardsPage";
import QuotesPage from "./pages/QuotesPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import AccountPage from "./pages/AccountPage";
import Propuesta from "./pages/Propuesta";
import AdminLeads from "./pages/AdminLeads";
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
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<CatalogPage />} />
                <Route path="/cotizar" element={<QuotePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/recuperar-contrasena" element={<PasswordRecoveryPage />} />
                <Route path="/nueva-contrasena" element={<NewPasswordPage />} />
                <Route path="/propuesta" element={<Propuesta />} />

                {/* Auth required */}
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/dashboard/pedidos" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
                <Route path="/dashboard/equipo" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
                <Route path="/dashboard/recompensas" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
                <Route path="/cotizaciones" element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/checkout/confirmacion" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
                <Route path="/cuenta" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

                {/* Legacy */}
                <Route path="/admin-leads" element={<AdminLeads />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppDependenciesProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;