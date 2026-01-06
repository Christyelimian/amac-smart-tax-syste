import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { PWANavigation } from "@/components/ui/pwa-navigation";

// Public routes
import Index from "@/pages/Index";
import Portal from "@/pages/Portal";
import Revenue from "@/pages/Revenue";
import Services from "@/pages/Services";
import PaymentPortal from "@/pages/PaymentPortal";
import PaymentForm from "@/pages/PaymentForm";
import UploadProof from "@/pages/UploadProof";
import PaymentSuccess from "@/pages/PaymentSuccess";
import NotFound from "@/pages/NotFound";

// Auth routes
import Auth from "@/pages/auth/Auth";

// User dashboard routes
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import DashboardProperties from "@/pages/dashboard/DashboardProperties";
import DashboardPayments from "@/pages/dashboard/DashboardPayments";
import DashboardAssistant from "@/pages/dashboard/DashboardAssistant";
import DashboardSettings from "@/pages/dashboard/DashboardSettings";

// Admin dashboard routes
import { AdminLayout } from "@/layouts/AdminLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import Admin from "@/pages/admin/Admin";
import AdminTransactions from "@/pages/admin/AdminTransactions";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminPayers from "@/pages/admin/AdminPayers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminInsights from "@/pages/admin/AdminInsights";
import AdminEnforcement from "@/pages/admin/AdminEnforcement";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import PaymentVerification from "@/pages/admin/PaymentVerification";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({
  requireAdmin = false
}: {
  requireAdmin?: boolean;
}) {
  const { user, isLoading, isAdmin } = useAuth();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// Public Route Component (redirects authenticated users)
function PublicRoute() {
  const { user, isLoading } = useAuth();

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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <OfflineIndicator />
          <BrowserRouter>
            <PWANavigation>
              <Routes>
              {/* Public routes - redirect authenticated users */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/portal" element={<Portal />} />
                <Route path="/revenue" element={<Revenue />} />
                <Route path="/services" element={<Services />} />
                <Route path="/pay" element={<PaymentPortal />} />
                <Route path="/pay/:serviceCode" element={<PaymentForm />} />
                <Route path="/upload-proof/:paymentId" element={<UploadProof />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                {/* Mobile app menu routes */}
                <Route path="/auction" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">AMAC Auction - Coming Soon</h1></div>} />
                <Route path="/microfinance" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">AMAC Microfinance - Coming Soon</h1></div>} />
                <Route path="/emergency" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Emergency Lines - Coming Soon</h1></div>} />
                <Route path="/contact" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contact Us - Coming Soon</h1></div>} />
                <Route path="/about" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">About AMAC - Coming Soon</h1></div>} />
                <Route path="/support" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Support - Coming Soon</h1></div>} />
              </Route>

              {/* Auth routes */}
              <Route path="/auth" element={<Auth />} />

              {/* User dashboard routes (protected) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/properties" element={<DashboardProperties />} />
                  <Route path="/dashboard/payments" element={<DashboardPayments />} />
                  <Route path="/dashboard/assistant" element={<DashboardAssistant />} />
                  <Route path="/dashboard/settings" element={<DashboardSettings />} />
                </Route>
              </Route>

              {/* Admin dashboard routes (protected + admin only) */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route element={<AdminLayout />}>
                  <Route path="/admin/legacy" element={<Admin />} />
                  <Route path="/admin/transactions" element={<AdminTransactions />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/payers" element={<AdminPayers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/insights" element={<AdminInsights />} />
                  <Route path="/admin/enforcement" element={<AdminEnforcement />} />
                  <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                  <Route path="/admin/payment-verification" element={<PaymentVerification />} />
                </Route>
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </PWANavigation>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
