import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  CreditCard,
  Building2,
  Smartphone,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
  PieChart,
  BarChart3,
  Target
} from "lucide-react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";

interface Payment {
  id: string;
  reference: string;
  rrr: string;
  payer_name: string;
  payer_phone: string;
  service_name: string;
  revenue_type: string;
  zone_id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  confirmed_at?: string;
}

interface DashboardStats {
  todayCollection: number;
  yesterdayCollection: number;
  monthlyCollection: number;
  yearlyCollection: number;
  todayTarget: number;
  monthlyTarget: number;
  yearlyTarget: number;
  totalTransactions: number;
  pendingPayments: number;
  confirmedPayments: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayCollection: 0,
    yesterdayCollection: 0,
    monthlyCollection: 0,
    yearlyCollection: 0,
    todayTarget: 20000000, // 20M daily target
    monthlyTarget: 600000000, // 600M monthly target
    yearlyTarget: 8000000000, // 8B yearly target
    totalTransactions: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
  });

  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<any[]>([]);
  const [zoneBreakdown, setZoneBreakdown] = useState<any[]>([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    // Set up real-time updates
    const channel = supabase
      .channel('payments-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

      // Get today's payments
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', todayStart)
        .eq('status', 'confirmed');

      // Get yesterday's payments
      const { data: yesterdayPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart)
        .eq('status', 'confirmed');

      // Get monthly payments
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', monthStart)
        .eq('status', 'confirmed');

      // Get yearly payments
      const { data: yearlyPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', yearStart)
        .eq('status', 'confirmed');

      // Get recent payments
      const { data: recent } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const todayCollection = todayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const yesterdayCollection = yesterdayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const monthlyCollection = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const yearlyCollection = yearlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats(prev => ({
        ...prev,
        todayCollection,
        yesterdayCollection,
        monthlyCollection,
        yearlyCollection,
        totalTransactions: yearlyPayments?.length || 0,
        confirmedPayments: yearlyPayments?.length || 0,
        pendingPayments: recent?.filter(p => p.status === 'pending').length || 0,
      }));

      setRecentPayments(recent || []);

      // Calculate revenue breakdown
      const revenueMap = new Map();
      yearlyPayments?.forEach(payment => {
        const key = payment.revenue_type;
        if (!revenueMap.has(key)) {
          revenueMap.set(key, { name: payment.service_name, amount: 0, count: 0 });
        }
        const item = revenueMap.get(key);
        item.amount += payment.amount;
        item.count += 1;
      });

      const revenueData = Array.from(revenueMap.entries())
        .map(([key, data]: [string, any]) => ({
          revenue_type: key,
          service_name: data.name,
          amount: data.amount,
          count: data.count,
          percentage: yearlyCollection > 0 ? (data.amount / yearlyCollection) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      setRevenueBreakdown(revenueData);

      // Calculate zone breakdown
      const zoneMap = new Map();
      yearlyPayments?.forEach(payment => {
        const key = payment.zone_id || 'N/A';
        if (!zoneMap.has(key)) {
          zoneMap.set(key, { amount: 0, count: 0 });
        }
        const item = zoneMap.get(key);
        item.amount += payment.amount;
        item.count += 1;
      });

      const zoneData = Array.from(zoneMap.entries())
        .map(([zone, data]: [string, any]) => ({
          zone,
          amount: data.amount,
          count: data.count,
          percentage: yearlyCollection > 0 ? (data.amount / yearlyCollection) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      setZoneBreakdown(zoneData);

      // Calculate payment method breakdown
      const methodMap = new Map();
      yearlyPayments?.forEach(payment => {
        const key = payment.payment_method || 'card';
        if (!methodMap.has(key)) {
          methodMap.set(key, { amount: 0, count: 0 });
        }
        const item = methodMap.get(key);
        item.amount += payment.amount;
        item.count += 1;
      });

      const methodData = Array.from(methodMap.entries())
        .map(([method, data]: [string, any]) => ({
          method,
          amount: data.amount,
          count: data.count,
          percentage: yearlyCollection > 0 ? (data.amount / yearlyCollection) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      setPaymentMethodBreakdown(methodData);

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4" />;
      case 'ussd':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const todayProgress = stats.todayTarget > 0 ? (stats.todayCollection / stats.todayTarget) * 100 : 0;
  const monthlyProgress = stats.monthlyTarget > 0 ? (stats.monthlyCollection / stats.monthlyTarget) * 100 : 0;
  const yearlyProgress = stats.yearlyTarget > 0 ? (stats.yearlyCollection / stats.yearlyTarget) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AMAC Revenue Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  {formatDate(new Date())} • {formatTime(new Date())}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatTime(lastUpdated)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Today's Collection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Today's Collection</CardTitle>
                    <CardDescription>
                      {formatCurrency(stats.todayCollection)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${stats.todayCollection > stats.yesterdayCollection ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.todayCollection > stats.yesterdayCollection ? '▲' : '▼'}
                      {Math.abs(((stats.todayCollection - stats.yesterdayCollection) / stats.yesterdayCollection) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      vs yesterday ({formatCurrency(stats.yesterdayCollection)})
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to ₦{formatCurrency(stats.todayTarget)} target</span>
                      <span>{todayProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(todayProgress, 100)} className="h-3" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{stats.totalTransactions}</div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.confirmedPayments}</div>
                      <div className="text-sm text-muted-foreground">Confirmed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Monthly Collection */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.monthlyCollection)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Target className="mr-1 h-3 w-3" />
                      {monthlyProgress.toFixed(1)}% of ₦{formatCurrency(stats.monthlyTarget)} target
                    </div>
                    <Progress value={Math.min(monthlyProgress, 100)} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Yearly Collection */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Year</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.yearlyCollection)}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Target className="mr-1 h-3 w-3" />
                      {yearlyProgress.toFixed(1)}% of ₦{formatCurrency(stats.yearlyTarget)} target
                    </div>
                    <Progress value={Math.min(yearlyProgress, 100)} className="mt-3 h-2" />
                  </CardContent>
                </Card>

                {/* Live Transactions Feed */}
                <Card className="md:col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">🔴 Live Transactions</CardTitle>
                    <CardDescription>Updates every second</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {recentPayments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(payment.status)}
                            <div>
                              <div className="font-medium text-sm">{payment.service_name}</div>
                              <div className="text-xs text-muted-foreground">{payment.payer_name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(new Date(payment.created_at))}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Transactions
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Revenue Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Top Revenue Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueBreakdown.slice(0, 5).map((item, index) => (
                        <div key={item.revenue_type} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{item.service_name}</div>
                              <div className="text-xs text-muted-foreground">{item.count} transactions</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Zone Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Collection by Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {zoneBreakdown.map((item) => (
                        <div key={item.zone} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="uppercase">
                              Zone {item.zone}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {item.count} payments
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {paymentMethodBreakdown.map((item) => (
                        <div key={item.method} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getPaymentMethodIcon(item.method)}
                            <div>
                              <div className="font-medium text-sm capitalize">
                                {item.method.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.count} transactions
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Transactions</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(payment.status)}
                          <div>
                            <div className="font-medium">{payment.service_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.payer_name} • {payment.payer_phone}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.reference} • {formatDate(new Date(payment.created_at))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {payment.zone_id?.toUpperCase() || 'N/A'}
                          </Badge>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {payment.payment_method?.replace('_', ' ') || 'Card'}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Interactive charts coming soon</p>
                        <p className="text-sm">Daily, weekly, and monthly trends</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Zone Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Zone-wise collection breakdown</p>
                        <p className="text-sm">Performance metrics and comparisons</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Reports</CardTitle>
                  <CardDescription>Generate and download comprehensive revenue reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                      <Calendar className="w-8 h-8 mb-2" />
                      <span className="font-medium">Daily Report</span>
                      <span className="text-sm text-muted-foreground">Today's collection</span>
                    </Button>

                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                      <BarChart3 className="w-8 h-8 mb-2" />
                      <span className="font-medium">Weekly Report</span>
                      <span className="text-sm text-muted-foreground">7-day summary</span>
                    </Button>

                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                      <TrendingUp className="w-8 h-8 mb-2" />
                      <span className="font-medium">Monthly Report</span>
                      <span className="text-sm text-muted-foreground">Full month analysis</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
