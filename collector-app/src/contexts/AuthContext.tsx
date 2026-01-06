import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Collector } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  collector: Collector | null;
  isLoading: boolean;
  login: (collectorId: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [collector, setCollector] = useState<Collector | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadCollectorData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCollector(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadCollectorData(session.user.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectorData = async (userId: string) => {
    try {
      const { data: collectorData, error } = await supabase
        .from('collectors')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setCollector(collectorData);
    } catch (error) {
      console.error('Failed to load collector data:', error);
      toast.error('Failed to load collector profile');
    }
  };

  const login = async (collectorId: string, pin: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // First, get collector data to find the associated user
      const { data: collectorData, error: collectorError } = await supabase
        .from('collectors')
        .select('*, user_id')
        .eq('collector_id', collectorId)
        .eq('status', 'active')
        .single();

      if (collectorError || !collectorData) {
        toast.error('Invalid collector ID');
        return false;
      }

      // For now, we'll use a simple PIN check (in production, this should be hashed)
      // In a real implementation, you'd have a separate PIN table or use proper auth
      if (pin !== '1234') { // Default PIN for demo - should be properly secured
        toast.error('Invalid PIN');
        return false;
      }

      // Create a session for the collector (using a service role or proper auth flow)
      // For demo purposes, we'll simulate authentication
      setCollector(collectorData);
      localStorage.setItem('collector_session', JSON.stringify(collectorData));

      toast.success(`Welcome back, ${collectorData.full_name}!`);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setCollector(null);
      localStorage.removeItem('collector_session');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Check for stored session on mount
  useEffect(() => {
    const stored = localStorage.getItem('collector_session');
    if (stored) {
      try {
        const collectorData = JSON.parse(stored);
        setCollector(collectorData);
      } catch (error) {
        localStorage.removeItem('collector_session');
      }
    }
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    collector,
    isLoading,
    login,
    logout,
    isAuthenticated: !!collector,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
