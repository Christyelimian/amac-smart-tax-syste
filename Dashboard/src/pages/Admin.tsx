import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  Users,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface Payment {
  id: string;
  payer_name: string;
  service_name: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'failed';
  zone: string;
  created_at: string;
}

interface RevenueByType {
  name: string;
  value: number;
}

interface RevenueByZone {
  zone: string;
  amount: number;
}

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)'];

const MONTHLY_TARGET = 500000000; // ₦500M
const YEARLY_TARGET = 6000000000; // ₦6B

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    todayCollections: 0,
    todayTransactions: 0,
    successRate: 0,
    activeUsers: 0,
  });
  const [liveTransactions, setLiveTransactions] = useState<Payment[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByType[]>([]);
  const [revenueByZone, setRevenueByZone] = useState<RevenueByZone[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState(0);
  const [yearlyProgress, setYearlyProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAdminData();
      setupRealtimeSubscription();
    }
  }, [user, isAdmin]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-payments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          const newPayment = payload.new as Payment;
          setLiveTransactions((prev) => [newPayment, ...prev].slice(0, 20));
          
          if (newPayment.status === 'confirmed') {
            setStats((prev) => ({
              ...prev,
              todayCollections: prev.todayCollections + Number(newPayment.amount),
              todayTransactions: prev.todayTransactions + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAdminData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      // Fetch today's payments
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      // Fetch monthly total
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth.toISOString());

      // Fetch yearly total
      const { data: yearlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfYear.toISOString());

      // Fetch revenue by type
      const { data: typeData } = await supabase
        .from('payments')
        .select('revenue_type, amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth.toISOString());

      // Fetch revenue by zone
      const { data: zoneData } = await supabase
        .from('payments')
        .select('zone, amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth.toISOString());

      // Fetch unique payers today
      const { data: uniquePayers } = await supabase
        .from('payments')
        .select('payer_email')
        .gte('created_at', today.toISOString());

      const payments = todayPayments || [];
      const confirmedToday = payments.filter((p) => p.status === 'confirmed');
      const todayTotal = confirmedToday.reduce((sum, p) => sum + Number(p.amount), 0);
      
      const monthlyTotal = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const yearlyTotal = yearlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Aggregate revenue by type
      const typeAgg: Record<string, number> = {};
      typeData?.forEach((p) => {
        typeAgg[p.revenue_type] = (typeAgg[p.revenue_type] || 0) + Number(p.amount);
      });
      const sortedTypes = Object.entries(typeAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Aggregate revenue by zone
      const zoneAgg: Record<string, number> = {};
      zoneData?.forEach((p) => {
        const zoneName = `Zone ${p.zone.toUpperCase()}`;
        zoneAgg[zoneName] = (zoneAgg[zoneName] || 0) + Number(p.amount);
      });
      const zoneChart = Object.entries(zoneAgg).map(([zone, amount]) => ({ zone, amount }));

      setStats({
        todayCollections: todayTotal,
        todayTransactions: confirmedToday.length,
        successRate: payments.length > 0 ? Math.round((confirmedToday.length / payments.length) * 100) : 100,
        activeUsers: new Set(uniquePayers?.map((p) => p.payer_email)).size,
      });

      setLiveTransactions(payments.slice(0, 20) as Payment[]);
      setRevenueByType(sortedTypes);
      setRevenueByZone(zoneChart);
      setMonthlyProgress(Math.min(100, (monthlyTotal / MONTHLY_TARGET) * 100));
      setYearlyProgress(Math.min(100, (yearlyTotal / YEARLY_TARGET) * 100));
    } catch (error) {
      console.error('Error fetching admin data:', error);
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

  if (!user || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-8 fade-in">
        {/* Header with Live Status */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold">Command Center</h1>
              <div className="live-indicator">
                <span>LIVE</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Real-time revenue monitoring for AMAC • {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-sm font-medium text-success">All Systems Operational</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Command Center Style */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="command-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Today</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold">
                {isLoading ? (
                  <span className="shimmer inline-block w-32 h-8 bg-muted rounded" />
                ) : (
                  formatCurrency(stats.todayCollections)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Collections</p>
            </div>
          </div>
          
          <div className="command-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-info/10">
                <TrendingUp className="h-5 w-5 text-info" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Count</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold">
                {isLoading ? (
                  <span className="shimmer inline-block w-20 h-8 bg-muted rounded" />
                ) : (
                  stats.todayTransactions.toLocaleString()
                )}
              </p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
          </div>
          
          <div className="command-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Rate</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold">
                {isLoading ? (
                  <span className="shimmer inline-block w-16 h-8 bg-muted rounded" />
                ) : (
                  `${stats.successRate}%`
                )}
              </p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </div>
          
          <div className="command-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold">
                {isLoading ? (
                  <span className="shimmer inline-block w-12 h-8 bg-muted rounded" />
                ) : (
                  stats.activeUsers.toLocaleString()
                )}
              </p>
              <p className="text-sm text-muted-foreground">Payers Today</p>
            </div>
          </div>
        </div>

        {/* Target Progress - Enhanced */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="command-card overflow-visible">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-medium">Monthly Target</span>
                  <p className="text-xs text-muted-foreground">₦500M Goal</p>
                </div>
                <span className="text-2xl font-display font-bold text-primary">
                  {monthlyProgress.toFixed(0)}%
                </span>
              </div>
              <div className="relative">
                <Progress value={monthlyProgress} className="h-4" />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-foreground/20 rounded-full"
                  style={{ left: '50%' }}
                  title="50% milestone"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>₦0</span>
                <span>₦250M</span>
                <span>₦500M</span>
              </div>
            </CardContent>
          </Card>
          <Card className="command-card overflow-visible">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-medium">Yearly Target</span>
                  <p className="text-xs text-muted-foreground">₦6B Goal</p>
                </div>
                <span className="text-2xl font-display font-bold text-accent">
                  {yearlyProgress.toFixed(0)}%
                </span>
              </div>
              <div className="relative">
                <Progress value={yearlyProgress} className="h-4" />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>₦0</span>
                <span>₦3B</span>
                <span>₦6B</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue by Type */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByType.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {revenueByType.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No data available yet</p>
                  </div>
                </div>
              )}
              {revenueByType.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {revenueByType.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate">{item.name}</span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Zone */}
          <Card className="command-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByZone.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByZone} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="zone" 
                        width={70} 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.1)',
                        }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 6, 6, 0]}
                        background={{ fill: 'hsl(var(--muted) / 0.3)', radius: 6 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Transaction Feed - Enhanced */}
        <Card className="command-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="font-display text-lg">Live Transaction Feed</CardTitle>
              <div className="live-indicator">
                <span>STREAMING</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {liveTransactions.length} transactions today
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : liveTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-medium">Waiting for transactions...</p>
                <p className="text-muted-foreground">New payments will appear here in real-time</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                {liveTransactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-all duration-300 transaction-row",
                      tx.status === 'confirmed' 
                        ? "bg-success/5 hover:bg-success/10 border border-success/10" 
                        : tx.status === 'pending'
                        ? "bg-warning/5 hover:bg-warning/10 border border-warning/10"
                        : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          tx.status === 'confirmed'
                            ? 'bg-success shadow-[0_0_8px_hsl(var(--success)/0.5)]'
                            : tx.status === 'pending'
                            ? 'bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.5)]'
                            : 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.5)]'
                        )}
                      />
                      <div>
                        <p className="font-medium">{tx.payer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.service_name} • Zone {tx.zone?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-display font-semibold">{formatCurrency(tx.amount)}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(tx.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
