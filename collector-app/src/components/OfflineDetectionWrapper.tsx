import { Navigate, useLocation } from "react-router-dom";
import { useOffline } from "@/contexts/OfflineContext";

interface OfflineDetectionWrapperProps {
  children: React.ReactNode;
}

export function OfflineDetectionWrapper({ children }: OfflineDetectionWrapperProps) {
  const { isOnline } = useOffline();
  const location = useLocation();

  // If offline and not already on the offline page or login page, redirect to offline page
  if (!isOnline && location.pathname !== '/offline' && location.pathname !== '/login') {
    return <Navigate to="/offline" replace />;
  }

  return <>{children}</>;
}