import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import {
  CreditCard,
  Building,
  Smartphone,
  Phone,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Settings,
  Key,
  Webhook,
  Database,
  Zap,
  Shield,
} from 'lucide-react';

interface RemitaStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  todayRevenue: number;
  webhookEvents: number;
  reconciledPayments: number;
}

interface RecentPayment {
  id: string;
  rrr: string;
  amount: number;
  status: string;
  paymentChannel: string;
  createdAt: string;
  payerName: string;
}

export default function AdminRemitaIntegration() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<RemitaStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    webhookEvents: 0,
    reconciledPayments: 0,
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchRemitaStats();
      fetchRecentPayments();
      fetchWebhookLogs();
    }
  }, [user, isAdmin]);

  const fetchRemitaStats = async () => {
    try {
      // Get payment statistics
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount, created_at')
        .not('rrr', 'is', null);

      if (payments) {
        const totalPayments = payments.length;
        const successfulPayments = payments.filter(p => p.status === 'confirmed').length;
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const failedPayments = payments.filter(p => p.status === 'failed').length;
        const totalRevenue = payments
          .filter(p => p.status === 'confirmed')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRevenue = payments
          .filter(p => p.status === 'confirmed' && new Date(p.created_at) >= today)
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Get reconciled payments count
        const { data: reconciled } = await supabase
          .from('payments')
          .select('id')
          .eq('reconciled', true);

        setStats({
          totalPayments,
          successfulPayments,
          pendingPayments,
          failedPayments,
          totalRevenue,
          todayRevenue,
          webhookEvents: 0, // Would need webhook logs table
          reconciledPayments: reconciled?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching Remita stats:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('id, rrr, amount, status, payment_channel, created_at, payer_name')
        .not('rrr', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (payments) {
        setRecentPayments(payments as RecentPayment[]);
      }
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const fetchWebhookLogs = async () => {
    // Mock webhook logs - in real implementation, this would come from a webhook_logs table
    setWebhookLogs([
      {
        id: 1,
        event: 'payment.success',
        rrr: 'RRR123456789',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'processed'
      },
      {
        id: 2,
        event: 'payment.failed',
        rrr: 'RRR987654321',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'processed'
      }
    ]);
  };

  const getPaymentChannelIcon = (channel: string) => {
    switch (channel) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building className="h-4 w-4" />;
      case 'ussd':
        return <Phone className="h-4 w-4" />;
      case 'remita_app':
        return <Smartphone className="h-4 w-4" />;
      case 'pos':
        return <Upload className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">🔄 Remita Payment Integration</h1>
            <p className="text-muted-foreground mt-1">
              Real-time monitoring of Remita payment gateway operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Zap className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Payments</h3>
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-display font-bold">{stats.totalPayments}</p>
              <p className="text-sm text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Today's Revenue</h3>
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                {formatCurrency(stats.todayRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">Revenue collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Success Rate</h3>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                {stats.totalPayments > 0 ? Math.round((stats.successfulPayments / stats.totalPayments) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.successfulPayments}/{stats.totalPayments} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Reconciled</h3>
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-display font-bold text-blue-600">
                {stats.reconciledPayments}
              </p>
              <p className="text-sm text-muted-foreground">Auto-reconciled payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Channels Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>💳 Payment Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Card Payments</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Building className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-muted-foreground">Direct bank transfers</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="font-medium">USSD</p>
                <p className="text-sm text-muted-foreground">*737# payments</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Remita App</p>
                <p className="text-sm text-muted-foreground">Mobile app payments</p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="font-medium">POS</p>
                <p className="text-sm text-muted-foreground">Point of sale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Remita Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getPaymentChannelIcon(payment.paymentChannel || 'card')}
                        <div>
                          <p className="font-medium">{payment.payerName || 'Unknown Payer'}</p>
                          <p className="text-sm text-muted-foreground">
                            RRR: {payment.rrr} • {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(payment.status)}
                        <span className="text-sm text-muted-foreground">
                          {formatTime(payment.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentPayments.length === 0 && (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No Remita payments found yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {webhookLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Webhook className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{log.event}</p>
                          <p className="text-sm text-muted-foreground">
                            RRR: {log.rrr}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={log.status === 'processed' ? 'secondary' : 'destructive'}>
                          {log.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {webhookLogs.length === 0 && (
                    <div className="text-center py-12">
                      <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No webhook events yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Environment</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Demo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Currently using Remita demo environment
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Webhook URL</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      https://your-domain.supabase.co/functions/v1/remita-webhook
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Payment Processing</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Operational</Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Webhook Delivery</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Active</Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Auto-Reconciliation</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Running</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Payment Logs
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Webhooks
            </Button>
          </div>
          <Button>
            <Activity className="h-4 w-4 mr-2" />
            View Live Dashboard
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
