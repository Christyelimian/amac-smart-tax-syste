import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { OfflineIndicator } from "@/components/ui/offline-indicator";

// Auth pages
import Login from "@/pages/auth/Login";

// Collector pages
import Dashboard from "@/pages/collector/Dashboard";
import CollectPayment from "@/pages/collector/CollectPayment";
import Receipt from "@/pages/collector/Receipt";
import DailyReport from "@/pages/collector/DailyReport";
import OfflineMode from "@/pages/collector/OfflineMode";
import Settings from "@/pages/collector/Settings";

// Layouts
import { CollectorLayout } from "@/layouts/CollectorLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Protected Route Component
function ProtectedRoute() {
  const { collector, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!collector) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Public Route Component (redirects authenticated users)
function PublicRoute() {
  const { collector, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (collector) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect authenticated users */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Protected collector routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<CollectorLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collect" element={<CollectPayment />} />
            <Route path="/receipt/:paymentId" element={<Receipt />} />
            <Route path="/report" element={<DailyReport />} />
            <Route path="/offline" element={<OfflineMode />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
          <LocationProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <OfflineIndicator />
            <AppContent />
          </LocationProvider>
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
