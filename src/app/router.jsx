import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { Loader } from "../components/Loader";
import { ClientLayout } from "../clientes/components/ClientLayout";

// Landing Page
import Landing from "../landing/App";
import RegistroTerapeuta from "../landing/RegistroTerapeuta";
import RegistroExitoso from "../landing/RegistroExitoso";

// Feature Pages
import { Login } from "../features/auth/Login";
import { AuthCallback } from "../pages/AuthCallback";
import { Dashboard } from "../features/dashboard/Dashboard.page";
import { ProfessionalProfile } from "../features/professionalProfile/ProfessionalProfile.page";
import { Verification } from "../features/verification/Verification.page";
import { PlansSubscription } from "../features/plansSubscription/PlansSubscription.page";
import { Availability } from "../features/availability/Availability.page";
import { Bookings } from "../features/bookings/Bookings.page";
import { Clients } from "../features/clients/Clients.page";
import { ClientDetailPage } from "../features/clients/components/ClientDetailPage";
import { Chat } from "../features/chat/Chat.page";
import { DocumentsMaterials } from "../features/documentsMaterials/DocumentsMaterials.page";
import { Reviews } from "../features/reviews/Reviews.page";
import { Payments } from "../features/payments/Payments.page";
import { Notifications } from "../features/notifications/Notifications.page";
import { Integrations } from "../features/integrations/Integrations.page";
import { HelpCenter } from "../features/helpCenter/HelpCenter.page";
import { AccountSettings } from "../features/accountSettings/AccountSettings.page";

// Cliente Pages
import HomePage from "../clientes/pages/HomePage";
import AppointmentsPage from "../clientes/pages/AppointmentsPage";
import DashboardScreen from "../clientes/pages/DashboardScreen";
import FavoritesScreen from "../clientes/pages/FavoritesScreen";
import ReviewsPage from "../clientes/pages/ReviewsPage";
import DocumentsScreen from "../clientes/pages/DocumentsScreen";
import ChatScreen from "../clientes/pages/ChatScreen";
import SettingsScreen from "../clientes/pages/SettingsScreen";
import DictionaryScreen from "../clientes/pages/DictionaryScreen";
import PaymentHistoryScreen from "../clientes/pages/PaymentHistoryScreen";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return !isAuthenticated ? (
    children
  ) : (
    <Navigate to="/app/cliente/home" replace />
  );
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Landing Page - Pública */}
      <Route path="/" element={<Landing />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* OAuth Callback Route */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Registro de Terapeutas */}
      <Route path="/registro-terapeuta" element={<RegistroTerapeuta />} />
      <Route path="/registro-exitoso" element={<RegistroExitoso />} />

      {/* Protected Routes - Portal Cliente */}
      <Route
        path="/app/cliente"
        element={
          <PrivateRoute>
            <ClientLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/app/cliente/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="citas" element={<AppointmentsPage />} />
        <Route path="favoritos" element={<FavoritesScreen />} />
        <Route path="documentos" element={<DocumentsScreen />} />
        <Route path="resenas" element={<ReviewsPage />} />
        <Route path="dashboard" element={<DashboardScreen />} />
        <Route path="configuracion" element={<SettingsScreen />} />
        <Route path="diccionario" element={<DictionaryScreen />} />
        <Route path="chat" element={<ChatScreen />} />
        <Route path="notificaciones" element={<Notifications />} />
        <Route path="centro-ayuda" element={<HelpCenter />} />
        <Route path="pagos" element={<PaymentHistoryScreen />} />
      </Route>

      {/* Protected Routes - Portal Terapeuta */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/app/dashboard-profesional" replace />}
        />
        <Route path="dashboard-profesional" element={<Dashboard />} />
        <Route path="perfil-profesional" element={<ProfessionalProfile />} />
        <Route path="verificacion" element={<Verification />} />
        <Route path="planes-suscripcion" element={<PlansSubscription />} />
        <Route path="disponibilidad" element={<Availability />} />
        <Route path="reservas" element={<Bookings />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />
        <Route path="chat" element={<Chat />} />
        <Route path="documentos-materiales" element={<DocumentsMaterials />} />
        <Route path="reseñas" element={<Reviews />} />
        <Route path="pagos" element={<Payments />} />
        <Route path="notificaciones" element={<Notifications />} />
        <Route path="integraciones" element={<Integrations />} />
        <Route path="centro-ayuda" element={<HelpCenter />} />
        <Route path="configuracion-cuenta" element={<AccountSettings />} />
      </Route>

      {/* Catch all - Redirigir a landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
