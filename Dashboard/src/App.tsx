import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DebugAuth from "./pages/DebugAuth";
import Dashboard from "./pages/Dashboard";
import DashboardProperties from "./pages/DashboardProperties";
import DashboardPayments from "./pages/DashboardPayments";
import DashboardAssistant from "./pages/DashboardAssistant";
import DashboardSettings from "./pages/DashboardSettings";
import Admin from "./pages/Admin";
import AdminTransactions from "./pages/AdminTransactions";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminPayers from "./pages/AdminPayers";
import AdminSettings from "./pages/AdminSettings";
import AdminInsights from "./pages/AdminInsights";
import AdminEnforcement from "./pages/AdminEnforcement";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminVerifyPayments from "./pages/AdminVerifyPayments";
import AdminRevenueAnalytics from "./pages/AdminRevenueAnalytics";
import AdminBankReconciliation from "./pages/AdminBankReconciliation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/debug" element={<DebugAuth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/properties" element={<DashboardProperties />} />
            <Route path="/dashboard/payments" element={<DashboardPayments />} />
            <Route path="/dashboard/assistant" element={<DashboardAssistant />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/payers" element={<AdminPayers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/insights" element={<AdminInsights />} />
            <Route path="/admin/enforcement" element={<AdminEnforcement />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            <Route path="/admin/verify-payments" element={<AdminVerifyPayments />} />
            <Route path="/admin/revenue-analytics" element={<AdminRevenueAnalytics />} />
            <Route path="/admin/bank-reconciliation" element={<AdminBankReconciliation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
