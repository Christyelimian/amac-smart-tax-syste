import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/constants';
import {
  Loader2,
  TrendingUp,
  Users,
  CreditCard,
  BarChart3,
  Sparkles,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)'];

interface AIInsight {
  insights: string[];
  concerns: string[];
  recommendations: string[];
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('month');
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    avgTransaction: 0,
    totalTransactions: 0,
    uniquePayers: 0,
    topService: '',
    peakHour: '',
  });
  
  // Chart data
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; amount: number; prev: number }[]>([]);
  const [zonePerformance, setZonePerformance] = useState<{ zone: string; current: number; target: number }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; value: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  
  // AI Insights
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAnalytics();
    }
  }, [user, isAdmin, timePeriod]);

  const getDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString();
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        return quarterAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return yearAgo.toISOString();
      default: // month
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString();
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const startDate = getDateRange();

      // Fetch all confirmed payments for the period
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'confirmed')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (!payments) return;

      // Calculate stats
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const avgTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;
      const uniquePayers = new Set(payments.map((p) => p.payer_email)).size;

      // Top service
      const serviceCount: Record<string, number> = {};
      payments.forEach((p) => {
        serviceCount[p.service_name] = (serviceCount[p.service_name] || 0) + Number(p.amount);
      });
      const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Peak hour
      const hourCount: Record<number, number> = {};
      payments.forEach((p) => {
        const hour = new Date(p.created_at).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const peakHourNum = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      const peakHour = peakHourNum ? `${peakHourNum}:00` : 'N/A';

      setStats({
        totalRevenue,
        avgTransaction,
        totalTransactions: payments.length,
        uniquePayers,
        topService,
        peakHour,
      });

      // Daily revenue trend
      const dailyMap: Record<string, { current: number; prev: number }> = {};
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        dailyMap[key] = { current: 0, prev: 0 };
      }
      payments.forEach((p) => {
        const date = p.created_at.split('T')[0];
        if (dailyMap[date]) {
          dailyMap[date].current += Number(p.amount);
        }
      });
      setDailyRevenue(
        Object.entries(dailyMap).map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: data.current,
          prev: data.prev,
        }))
      );

      // Zone performance
      const zoneAmounts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
      const zoneTargets: Record<string, number> = { a: 150000000, b: 125000000, c: 125000000, d: 100000000 };
      payments.forEach((p) => {
        if (zoneAmounts[p.zone] !== undefined) {
          zoneAmounts[p.zone] += Number(p.amount);
        }
      });
      setZonePerformance(
        Object.entries(zoneAmounts).map(([zone, current]) => ({
          zone: `Zone ${zone.toUpperCase()}`,
          current,
          target: zoneTargets[zone],
        }))
      );

      // Payment methods
      const methodCount: Record<string, number> = {};
      payments.forEach((p) => {
        const method = p.payment_method || 'Unknown';
        methodCount[method] = (methodCount[method] || 0) + 1;
      });
      setPaymentMethods(
        Object.entries(methodCount).map(([name, value]) => ({ name, value }))
      );

      // Hourly distribution
      const hourlyCount: Record<number, number> = {};
      for (let i = 0; i < 24; i++) hourlyCount[i] = 0;
      payments.forEach((p) => {
        const hour = new Date(p.created_at).getHours();
        hourlyCount[hour]++;
      });
      setHourlyData(
        Object.entries(hourlyCount).map(([hour, count]) => ({
          hour: `${hour}:00`,
          count,
        }))
      );
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIInsights = async () => {
    try {
      setIsGeneratingInsights(true);
      
      const revenueData = {
        totalRevenue: stats.totalRevenue,
        avgTransaction: stats.avgTransaction,
        totalTransactions: stats.totalTransactions,
        uniquePayers: stats.uniquePayers,
        topService: stats.topService,
        zonePerformance: zonePerformance,
        dailyTrend: dailyRevenue.slice(-7),
      };

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Analyze this AMAC revenue data and provide:
            1. Top 3 insights about collection patterns
            2. 2 anomalies or concerns
            3. 3 actionable recommendations for increasing revenue
            
            Data: ${JSON.stringify(revenueData)}
            
            Respond with a JSON object in this exact format:
            {
              "insights": ["insight 1", "insight 2", "insight 3"],
              "concerns": ["concern 1", "concern 2"],
              "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
            }`,
        },
      });

      if (response.data?.response) {
        // Try to parse JSON from response
        const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAiInsights(parsed);
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsGeneratingInsights(false);
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
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive revenue analysis and AI-powered insights
            </p>
          </div>
          <Tabs value={timePeriod} onValueChange={setTimePeriod}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="primary"
            isLoading={isLoading}
          />
          <StatCard
            title="Avg. Transaction"
            value={formatCurrency(stats.avgTransaction)}
            icon={<CreditCard className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toLocaleString()}
            icon={<BarChart3 className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Unique Payers"
            value={stats.uniquePayers.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Top Service"
            value={stats.topService.slice(0, 15) + (stats.topService.length > 15 ? '...' : '')}
            isLoading={isLoading}
          />
          <StatCard
            title="Peak Hour"
            value={stats.peakHour}
            isLoading={isLoading}
          />
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenue}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`} fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Zone Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Zone Performance vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zonePerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="zone" width={70} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="current" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Current" />
                    <Bar dataKey="target" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentMethods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Transaction Distribution by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" fontSize={10} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">AI-Powered Insights</CardTitle>
              </div>
              <Button
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isGeneratingInsights ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Generate Insights
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiInsights ? (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Insights */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <Lightbulb className="h-4 w-4" />
                    <span className="font-semibold text-sm">Key Insights</span>
                  </div>
                  {aiInsights.insights.map((insight, i) => (
                    <div key={i} className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>

                {/* Concerns */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Concerns</span>
                  </div>
                  {aiInsights.concerns.map((concern, i) => (
                    <div key={i} className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <p className="text-sm">{concern}</p>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Target className="h-4 w-4" />
                    <span className="font-semibold text-sm">Recommendations</span>
                  </div>
                  {aiInsights.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Generate Insights" to get AI-powered analysis of your revenue data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
