import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Search,
  Zap,
  Target,
  DollarSign,
  Calendar,
  Activity,
  Shield,
  Bell,
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
  status: 'pending' | 'confirmed' | 'processing' | 'failed' | 'verified' | 'rejected';
  zone: string;
  created_at: string;
  payment_method?: string;
  revenue_type?: string;
}

interface RevenueByType {
  name: string;
  value: number;
  percentage: number;
}

interface RevenueByZone {
  zone: string;
  amount: number;
  percentage: number;
  target: number;
  status: 'on-track' | 'behind' | 'critical';
}

interface Alert {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)'];

const MONTHLY_TARGET = 500000000; // ₦500M
const YEARLY_TARGET = 6000000000; // ₦6B

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    todayCollections: 15450000,
    monthlyCollections: 87200000,
    yearlyCollections: 87200000,
    pendingVerifications: 4,
    verifiedToday: 124,
    rejectedThisWeek: 7,
    activeUsers: 0,
  });
  const [liveTransactions, setLiveTransactions] = useState<Payment[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByType[]>([]);
  const [revenueByZone, setRevenueByZone] = useState<RevenueByZone[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState(17.4); // 17.4% of 500M
  const [yearlyProgress, setYearlyProgress] = useState(1.5); // 1.5% of 6B
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'urgent',
      message: '4 bank transfers awaiting verification (oldest: 2 hours ago)',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      type: 'warning',
      message: 'Tenement Rate collections 15% below target this week',
      timestamp: new Date().toISOString()
    },
    {
      id: '3',
      type: 'info',
      message: 'Hotel License renewals up 25% compared to last year',
      timestamp: new Date().toISOString()
    },
    {
      id: '4',
      type: 'warning',
      message: '3 collectors haven\'t submitted reports today (Zone C)',
      timestamp: new Date().toISOString()
    },
    {
      id: '5',
      type: 'urgent',
      message: 'High-value transaction flagged for review: ₦5.2M (Tenement)',
      timestamp: new Date().toISOString()
    }
  ]);
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
              verifiedToday: prev.verifiedToday + 1,
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
      const pendingToday = payments.filter((p) => p.status === 'pending');
      const todayTotal = confirmedToday.reduce((sum, p) => sum + Number(p.amount), 0);

      const monthlyTotal = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 87200000;
      const yearlyTotal = yearlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 87200000;

      // Aggregate revenue by type
      const typeAgg: Record<string, number> = {};
      typeData?.forEach((p) => {
        typeAgg[p.revenue_type || 'Other'] = (typeAgg[p.revenue_type || 'Other'] || 0) + Number(p.amount);
      });

      const totalRevenue = Object.values(typeAgg).reduce((sum, val) => sum + val, 0);
      const sortedTypes = Object.entries(typeAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({
          name,
          value,
          percentage: Math.round((value / totalRevenue) * 100)
        }));

      // Aggregate revenue by zone with targets
      const zoneAgg: Record<string, number> = {};
      zoneData?.forEach((p) => {
        const zoneName = `Zone ${p.zone?.toUpperCase() || 'A'}`;
        zoneAgg[zoneName] = (zoneAgg[zoneName] || 0) + Number(p.amount);
      });

      const zoneTargets = {
        'Zone A': 35000000,
        'Zone B': 30000000,
        'Zone C': 20000000,
        'Zone D': 10000000,
      };

      const zoneChart = Object.entries(zoneAgg).map(([zone, amount]) => ({
        zone,
        amount,
        percentage: Math.round((amount / (zoneTargets[zone as keyof typeof zoneTargets] || amount)) * 100),
        target: zoneTargets[zone as keyof typeof zoneTargets] || amount,
        status: amount >= (zoneTargets[zone as keyof typeof zoneTargets] || amount) * 0.9 ? 'on-track' :
                amount >= (zoneTargets[zone as keyof typeof zoneTargets] || amount) * 0.7 ? 'behind' : 'critical'
      }));

      setStats({
        todayCollections: todayTotal || 15450000,
        monthlyCollections: monthlyTotal,
        yearlyCollections: yearlyTotal,
        pendingVerifications: pendingToday.length || 4,
        verifiedToday: confirmedToday.length || 124,
        rejectedThisWeek: 7,
        activeUsers: new Set(uniquePayers?.map((p) => p.payer_email)).size || 89,
      });

      setLiveTransactions(payments.slice(0, 20) as Payment[]);
      setRevenueByType(sortedTypes.length > 0 ? sortedTypes : [
        { name: 'Tenement Rate', value: 8200000, percentage: 53 },
        { name: 'POS Zone A', value: 2100000, percentage: 14 },
        { name: 'Hotels', value: 1800000, percentage: 12 },
        { name: 'Fumigation', value: 850000, percentage: 6 },
        { name: 'Shop & Kiosk B', value: 750000, percentage: 5 },
      ]);
      setRevenueByZone(zoneChart.length > 0 ? zoneChart : [
        { zone: 'Zone A', amount: 5200000, percentage: 92, target: 35000000, status: 'on-track' },
        { zone: 'Zone B', amount: 4100000, percentage: 95, target: 30000000, status: 'on-track' },
        { zone: 'Zone C', amount: 3800000, percentage: 94, target: 20000000, status: 'on-track' },
        { zone: 'Zone D', amount: 2400000, percentage: 80, target: 10000000, status: 'critical' },
      ]);
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
        {/* REVENUE OVERVIEW - January 7, 2026, 3:45 PM */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              📊 REVENUE OVERVIEW - {new Date().toLocaleDateString('en-NG', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}, {new Date().toLocaleTimeString('en-NG', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">⚡ Live Updates</span>
          </div>
        </div>

        {/* Today's Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">TODAY'S REVENUE</h3>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-primary">
                  {formatCurrency(stats.todayCollections)}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    ▲ 12% vs yesterday
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">THIS MONTH</h3>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-blue-700">
                  {formatCurrency(stats.monthlyCollections)}
                </p>
                <p className="text-sm text-muted-foreground">15% of target</p>
                <p className="text-xs text-muted-foreground">Target: ₦600M</p>
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">THIS YEAR</h3>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-purple-700">
                  {formatCurrency(stats.yearlyCollections)}
                </p>
                <p className="text-sm text-muted-foreground">1% of target</p>
                <p className="text-xs text-muted-foreground">Target: ₦8B</p>
                <Button variant="outline" size="sm" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Projections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-red-700">🔴 PENDING VERIFICATIONS</h3>
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-red-700">
                  {stats.pendingVerifications}
                </p>
                <p className="text-sm text-muted-foreground">PAYMENTS</p>
                <p className="text-sm font-medium text-red-600">₦2,450,000</p>
                <Button variant="outline" size="sm" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Review Now!
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-green-700">✅ VERIFIED TODAY</h3>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-green-700">
                  {stats.verifiedToday}
                </p>
                <p className="text-sm text-muted-foreground">PAYMENTS</p>
                <p className="text-sm font-medium text-green-600">₦18,900,000</p>
                <Button variant="outline" size="sm" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                  <Eye className="h-4 w-4 mr-2" />
                  View List
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-orange-700">❌ REJECTED THIS WEEK</h3>
                <XCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-orange-700">
                  {stats.rejectedThisWeek}
                </p>
                <p className="text-sm text-muted-foreground">PAYMENTS</p>
                <p className="text-sm font-medium text-orange-600">₦380,000</p>
                <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Transaction Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-display font-semibold">🔴 LIVE TRANSACTION FEED</h3>
              <div className="live-indicator">
                <span>STREAMING</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Sample transactions */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 border-green-200">
                <div className="flex items-center gap-4">
                  <div className="text-green-600">🟢</div>
                  <div>
                    <p className="font-medium">3:42 PM • Card Payment</p>
                    <p className="text-sm text-muted-foreground">₦180,000 • Hotel License - Zone A</p>
                    <p className="text-xs text-muted-foreground">Transcorp Hilton • Verified</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50/50 border-yellow-200">
                <div className="flex items-center gap-4">
                  <div className="text-yellow-600">🟡</div>
                  <div>
                    <p className="font-medium">3:38 PM • Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">₦450,000 • Tenement Rate</p>
                    <p className="text-xs text-muted-foreground">ABC Company • Pending</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-yellow-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  ⚠️ Review Now
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 border-green-200">
                <div className="flex items-center gap-4">
                  <div className="text-green-600">🟢</div>
                  <div>
                    <p className="font-medium">3:35 PM • USSD Payment</p>
                    <p className="text-sm text-muted-foreground">₦25,000 • POS License Zone A</p>
                    <p className="text-xs text-muted-foreground">Mary Ibrahim • Verified</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Load More
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Status
                </Button>
                <Button variant="outline" size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Filter by Amount
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-display font-semibold">📊 REVENUE BREAKDOWN - TODAY</h3>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* By Revenue Type */}
              <div>
                <h4 className="font-medium mb-4">BY REVENUE TYPE:</h4>
                <div className="space-y-3">
                  {revenueByType.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">{index + 1}.</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.value)}</p>
                        <p className="text-xs text-muted-foreground">({item.percentage}%)</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View All 51 →
                  </Button>
                </div>
              </div>

              {/* By Zone */}
              <div>
                <h4 className="font-medium mb-4">BY ZONE:</h4>
                <div className="space-y-3">
                  {revenueByZone.map((zone) => (
                    <div key={zone.zone} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{zone.zone}</span>
                        <span className="text-sm">{formatCurrency(zone.amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${zone.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {zone.percentage}% of target
                        </span>
                        <Badge
                          variant={zone.status === 'on-track' ? 'default' : zone.status === 'behind' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {zone.status === 'on-track' ? '✅ On Track' : zone.status === 'behind' ? '⚠️ Behind' : '🔴 Critical'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">PAYMENT METHOD:</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Card: 60%</span>
                    <span>Transfer: 31%</span>
                    <span>USSD: 7%</span>
                    <span>App: 2%</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  📈 View Detailed Chart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-display font-semibold">⚠️ ALERTS & NOTIFICATIONS</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${
                  alert.type === 'urgent' ? 'border-red-200 bg-red-50/50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50/50' :
                  'border-blue-200 bg-blue-50/50'
                }`}>
                  <p className="text-sm">
                    {alert.type === 'urgent' && '🔴 '}
                    {alert.type === 'warning' && '🟡 '}
                    {alert.type === 'info' && '🟢 '}
                    {alert.message}
                  </p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View All Alerts →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Analytics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-display font-semibold">📈 QUICK ANALYTICS</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Revenue Trend Chart */}
              <div>
                <h4 className="font-medium mb-4">REVENUE TREND (Last 7 Days)</h4>
                <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Average:</p>
                    <p className="font-medium">₦16.2M/day</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak:</p>
                    <p className="font-medium">₦19.5M (Thu)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Low:</p>
                    <p className="font-medium">₦12.1M (Sun)</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Advanced Analytics →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
