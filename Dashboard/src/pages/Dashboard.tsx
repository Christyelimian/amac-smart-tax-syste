import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/constants';
import {
  Wallet,
  Building2,
  CalendarClock,
  Shield,
  Plus,
  CreditCard,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Payment {
  id: string;
  service_name: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'failed';
  created_at: string;
  reference: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalPaid: 0,
    propertiesCount: 0,
    upcomingDues: 0,
    complianceScore: 85,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total paid in 2026
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, service_name, status, created_at, reference, id')
        .eq('user_id', user!.id)
        .gte('created_at', '2026-01-01')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('user_properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch upcoming dues
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: upcomingCount } = await supabase
        .from('user_properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .lt('due_date', thirtyDaysFromNow.toISOString())
        .gte('due_date', new Date().toISOString());

      const confirmedPayments = paymentsData?.filter(p => p.status === 'confirmed') || [];
      const totalPaid = confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalPaid,
        propertiesCount: propertiesCount || 0,
        upcomingDues: upcomingCount || 0,
        complianceScore: Math.min(100, 60 + (confirmedPayments.length * 10)),
      });

      setRecentPayments((paymentsData as Payment[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your tax compliance status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Paid (2026)"
            value={formatCurrency(stats.totalPaid)}
            icon={<Wallet className="h-5 w-5" />}
            variant="primary"
            isLoading={isLoading}
            subtitle="Year to date"
          />
          <StatCard
            title="Registered Properties"
            value={stats.propertiesCount}
            icon={<Building2 className="h-5 w-5" />}
            variant="default"
            isLoading={isLoading}
            subtitle="Properties & businesses"
          />
          <StatCard
            title="Upcoming Dues"
            value={stats.upcomingDues}
            icon={<CalendarClock className="h-5 w-5" />}
            variant={stats.upcomingDues > 0 ? 'warning' : 'default'}
            isLoading={isLoading}
            subtitle="Due in 30 days"
          />
          <StatCard
            title="Compliance Score"
            value={`${stats.complianceScore}%`}
            icon={<Shield className="h-5 w-5" />}
            variant="success"
            isLoading={isLoading}
            trend={{ value: 5, label: 'vs last month' }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button size="lg" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/dashboard/properties">
              <CreditCard className="h-6 w-6" />
              <span>Pay Now</span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/dashboard/properties">
              <Plus className="h-6 w-6" />
              <span>Add Property</span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to="/dashboard/assistant">
              <CalendarClock className="h-6 w-6" />
              <span>Ask AI Assistant</span>
            </Link>
          </Button>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/payments">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payments yet. Make your first payment to get started!</p>
                <Button className="mt-4" asChild>
                  <Link to="/dashboard/properties">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property & Pay
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.service_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.created_at)} • {payment.reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
