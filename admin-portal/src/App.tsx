import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Import pages
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import PaymentManagement from '@/pages/PaymentManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/admin-portal" element={<Navigate to="/admin-portal/login" replace />} />
          <Route path="/admin-portal/login" element={<AdminLogin />} />
          
          {/* Protected routes */}
          <Route path="/admin-portal/dashboard" element={<AdminDashboard />} />
          <Route path="/admin-portal/payments" element={<PaymentManagement />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/admin-portal/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;