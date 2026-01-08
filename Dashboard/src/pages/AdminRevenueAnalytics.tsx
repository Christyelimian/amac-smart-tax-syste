import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/constants';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Mail,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  growthRate: number;
  complianceRate: number;
  averageDaily: number;
  peakDay: { day: string; amount: number };
  lowDay: { day: string; amount: number };
}

interface RevenueByType {
  name: string;
  value: number;
  percentage: number;
  growth: number;
}

interface ZonePerformance {
  zone: string;
  revenue: number;
  target: number;
  rate: number;
  status: 'on-track' | 'behind' | 'critical';
  growth: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

const COLORS = ['hsl(217, 71%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(43, 96%, 56%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)'];

export default function AdminRevenueAnalytics() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('jan1-jan7');
  const [comparePeriod, setComparePeriod] = useState('last-year');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 87200000,
    monthlyRevenue: 87200000,
    yearlyRevenue: 87200000,
    growthRate: 18,
    complianceRate: 67,
    averageDaily: 12457142,
    peakDay: { day: 'Thu', amount: 19500000 },
    lowDay: { day: 'Sun', amount: 12100000 },
  });

  const [revenueByType, setRevenueByType] = useState<RevenueByType[]>([
    { name: 'Tenement Rate', value: 45200000, percentage: 52, growth: 22 },
    { name: 'Shop & Kiosk (All)', value: 12800000, percentage: 15, growth: -5 },
    { name: 'Hotels', value: 8500000, percentage: 10, growth: 15 },
    { name: 'POS Licenses (All)', value: 6200000, percentage: 7, growth: 8 },
    { name: 'Motorcycles (All)', value: 4800000, percentage: 5.5, growth: 12 },
    { name: 'Fumigation', value: 3100000, percentage: 3.5, growth: -2 },
    { name: 'Filling Stations', value: 2400000, percentage: 2.8, growth: 18 },
    { name: 'Banks', value: 1900000, percentage: 2.2, growth: 25 },
    { name: 'Markets (All)', value: 1500000, percentage: 1.7, growth: 5 },
    { name: 'Waste Management', value: 800000, percentage: 0.9, growth: -8 },
  ]);

  const [zonePerformance, setZonePerformance] = useState<ZonePerformance[]>([
    { zone: 'Zone A', revenue: 32100000, target: 35000000, rate: 92, status: 'on-track', growth: 18 },
    { zone: 'Zone B', revenue: 28400000, target: 30000000, rate: 95, status: 'on-track', growth: 22 },
    { zone: 'Zone C', revenue: 18700000, target: 20000000, rate: 94, status: 'on-track', growth: 15 },
    { zone: 'Zone D', revenue: 8000000, target: 10000000, rate: 80, status: 'critical', growth: -5 },
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { method: 'Card (Paystack)', amount: 52300000, percentage: 60, count: 1240 },
    { method: 'Bank Transfer', amount: 27000000, percentage: 31, count: 856 },
    { method: 'USSD', amount: 6100000, percentage: 7, count: 423 },
    { method: 'Remita App', amount: 1700000, percentage: 2, count: 98 },
  ]);

  const [collectionTimeData] = useState([
    { time: '8-10AM', percentage: 12, amount: 10500000 },
    { time: '10-12PM', percentage: 25, amount: 21875000 },
    { time: '12-2PM', percentage: 28, amount: 24500000 },
    { time: '2-4PM', percentage: 20, amount: 17500000 },
    { time: '4-6PM', percentage: 15, amount: 13125000 },
  ]);

  const [insights, setInsights] = useState([
    'Tenement Rate collections up 22% - likely due to new reminders',
    'Zone D underperforming - consider additional collectors',
    'Thursday is highest collection day (avg ₦18.5M)',
    'Bank transfer rejections up 15% - improve evidence guidelines',
    'Hotel renewals peaking - annual cycle January-February',
  ]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAnalyticsData();
    }
  }, [user, isAdmin, dateRange, comparePeriod]);

  const fetchAnalyticsData = async () => {
    try {
      // In a real implementation, this would fetch data based on dateRange and comparePeriod
      // For now, we'll use the mock data
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ On Track</Badge>;
      case 'behind':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Behind</Badge>;
      case 'critical':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">🔴 Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">📊 REVENUE ANALYTICS & INSIGHTS</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Date Range:</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jan1-jan7">Jan 1 - Jan 7, 2026</SelectItem>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Compare to:</span>
              <Select value={comparePeriod} onValueChange={setComparePeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-year">Same period last year</SelectItem>
                  <SelectItem value="last-month">Previous month</SelectItem>
                  <SelectItem value="last-quarter">Previous quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Total Revenue</h3>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-display font-bold">{formatCurrency(analyticsData.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">vs {formatCurrency(74000000)} last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Avg Daily Collection</h3>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-display font-bold">{formatCurrency(analyticsData.averageDaily)}</p>
              <p className="text-sm text-muted-foreground">vs {formatCurrency(10571428)} last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Growth Rate</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                ▲ {analyticsData.growthRate}%
              </p>
              <p className="text-sm text-muted-foreground">YoY</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Compliance Rate</h3>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-display font-bold">{analyticsData.complianceRate}%</p>
              <p className="text-sm text-muted-foreground">vs 62% last period</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle>REVENUE BY SOURCE (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueByType.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-8">{index + 1}.</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{item.percentage}%</p>
                      <div className={`flex items-center gap-1 text-sm ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(item.growth)}%
                      </div>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone Performance */}
        <Card>
          <CardHeader>
            <CardTitle>ZONE PERFORMANCE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {zonePerformance.map((zone) => (
                <div key={zone.zone} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{zone.zone}</h4>
                    {getStatusBadge(zone.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Revenue:</span>
                      <span className="font-medium">{formatCurrency(zone.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target:</span>
                      <span className="font-medium">{formatCurrency(zone.target)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rate:</span>
                      <span className="font-medium">{zone.rate}%</span>
                    </div>
                    <Progress value={zone.rate} className="h-2" />
                    <div className={`flex items-center gap-1 text-xs ${zone.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {zone.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(zone.growth)}% growth
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>PAYMENT METHOD BREAKDOWN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.method} className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">{method.method}</h4>
                  <p className="text-2xl font-display font-bold text-primary mb-1">
                    {method.percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(method.amount)}</p>
                  <p className="text-xs text-muted-foreground">{method.count} transactions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collection Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>COLLECTION TIME DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectionTimeData.map((timeSlot) => (
                <div key={timeSlot.time} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{timeSlot.time}:</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full"
                        style={{ width: `${timeSlot.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-sm text-muted-foreground text-right">
                    {timeSlot.percentage}%
                  </div>
                  <div className="w-24 text-sm text-muted-foreground text-right">
                    {formatCurrency(timeSlot.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              AI INSIGHTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50/50">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email Report
            </Button>
          </div>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Advanced Analytics
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
