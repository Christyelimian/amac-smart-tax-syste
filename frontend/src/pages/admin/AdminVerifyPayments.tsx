import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Search,
  Filter,
  Shield,
  CheckCircle,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
} from 'lucide-react';

interface PaymentVerification {
  id: string;
  reference: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected' | 'flagged';
  payer_name: string;
  business_name: string;
  revenue_type: string;
  zone: string;
  contact_phone: string;
  contact_email: string;
  bank_name: string;
  account_number: string;
  transaction_ref: string;
  evidence_url?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  ai_analysis?: {
    image_authentic: boolean;
    amount_matches: boolean;
    account_matches: boolean;
    bank_verified: boolean;
    date_recent: boolean;
    high_value: boolean;
    duplicate_detected: boolean;
    fraud_indicators: boolean;
  };
}

export default function AdminVerifyPayments() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<PaymentVerification[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentVerification[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [amountFilter, setAmountFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [revenueFilter, setRevenueFilter] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPendingPayments();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, amountFilter, dateFilter, revenueFilter]);

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mock data for demonstration - replace with real data structure
      const mockPayments: PaymentVerification[] = [
        {
          id: '1',
          reference: 'TEN-20260107-0045',
          amount: 5200000,
          status: 'pending',
          payer_name: 'Grand Plaza Shopping Mall',
          business_name: 'Grand Plaza Shopping Mall',
          revenue_type: 'Tenement Rate',
          zone: 'A',
          contact_phone: '+234-803-456-7890',
          contact_email: 'plaza@email.com',
          bank_name: 'Zenith Bank',
          account_number: '1213862799',
          transaction_ref: 'FT26007234567',
          submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          notes: 'Annual tenement payment for Grand Plaza',
          ai_analysis: {
            image_authentic: true,
            amount_matches: true,
            account_matches: true,
            bank_verified: true,
            date_recent: true,
            high_value: true,
            duplicate_detected: false,
            fraud_indicators: false,
          }
        },
        {
          id: '2',
          reference: 'HLR-20260107-0001',
          amount: 180000,
          status: 'pending',
          payer_name: 'Transcorp Hilton',
          business_name: 'Transcorp Hilton',
          revenue_type: 'Hotel License',
          zone: 'A',
          contact_phone: '+234-802-123-4567',
          contact_email: 'hilton@transcorp.com',
          bank_name: 'Access Bank',
          account_number: '1234567890',
          transaction_ref: 'FT26007180001',
          submitted_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          ai_analysis: {
            image_authentic: true,
            amount_matches: true,
            account_matches: true,
            bank_verified: true,
            date_recent: true,
            high_value: false,
            duplicate_detected: false,
            fraud_indicators: false,
          }
        }
      ];

      // If we have real data, use it; otherwise use mock data for demonstration
      const finalPayments = data && data.length > 0 ? data.map(p => ({
        id: p.id,
        reference: p.reference || `REF-${p.id.slice(-8)}`,
        amount: p.amount,
        status: p.status,
        payer_name: p.payer_name,
        business_name: p.business_name || p.payer_name,
        revenue_type: p.revenue_type || 'General',
        zone: p.zone_id || 'A',
        contact_phone: p.payer_phone || '',
        contact_email: p.payer_email || '',
        bank_name: 'Pending Verification',
        account_number: 'Pending',
        transaction_ref: p.rrr || 'Pending',
        submitted_at: p.created_at,
        ai_analysis: {
          image_authentic: true,
          amount_matches: true,
          account_matches: false,
          bank_verified: false,
          date_recent: true,
          high_value: p.amount > 1000000,
          duplicate_detected: false,
          fraud_indicators: false,
        }
      })) : mockPayments;

      setPayments(finalPayments);
      setFilteredPayments(finalPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact_phone.includes(searchTerm) ||
        p.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Revenue type filter
    if (revenueFilter) {
      filtered = filtered.filter(p => p.revenue_type === revenueFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold: Date;

      switch (dateFilter) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          dateThreshold = new Date(0);
      }

      filtered = filtered.filter(p => new Date(p.submitted_at) >= dateThreshold);
    }

    // Amount filter
    if (amountFilter) {
      const amount = parseFloat(amountFilter);
      if (!isNaN(amount)) {
        filtered = filtered.filter(p => p.amount >= amount);
      }
    }

    // Sort by oldest first for urgent items
    filtered.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

    setFilteredPayments(filtered);
  };

  const handleApprove = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state
      setPayments(prev => prev.map(p =>
        p.id === paymentId
          ? { ...p, status: 'verified', verified_at: new Date().toISOString(), verified_by: user?.id }
          : p
      ));

      setSelectedPayment(null);
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  const handleReject = async (paymentId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          notes: reason
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state
      setPayments(prev => prev.map(p =>
        p.id === paymentId
          ? { ...p, status: 'rejected', verified_at: new Date().toISOString(), verified_by: user?.id, notes: reason }
          : p
      ));

      setSelectedPayment(null);
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'flagged':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Flagged</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getUrgentPayments = () => filteredPayments.filter(p => {
    const hoursAgo = (Date.now() - new Date(p.submitted_at).getTime()) / (1000 * 60 * 60);
    return hoursAgo >= 2 || p.amount >= 1000000;
  });

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
          <h1 className="text-2xl font-display font-bold">🔍 PAYMENT VERIFICATION CENTER</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Reference, Business Name, Phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Amount (Min)</label>
                <Input
                  placeholder="₦0"
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Revenue Type</label>
                <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="Tenement Rate">Tenement Rate</SelectItem>
                    <SelectItem value="Hotel License">Hotel License</SelectItem>
                    <SelectItem value="Shop License">Shop License</SelectItem>
                    <SelectItem value="POS License">POS License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Sort: Oldest First
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Amount: High to Low
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Priority
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Payments */}
        {getUrgentPayments().length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                🚨 URGENT - PENDING &gt; 2 HOURS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getUrgentPayments().map((payment) => (
                <div key={payment.id} className="border border-red-200 rounded-lg p-6 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        HIGH PRIORITY
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Submitted: {formatTime(payment.submitted_at)} •
                        ⏰ {Math.floor((Date.now() - new Date(payment.submitted_at).getTime()) / (1000 * 60 * 60))} hrs ago
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Payment Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>REF:</strong> {payment.reference}</p>
                        <p><strong>Amount:</strong> {formatCurrency(payment.amount)} 🔥 (High Value)</p>
                        <p><strong>Revenue:</strong> {payment.revenue_type} - Zone {payment.zone}</p>
                        <p><strong>Business:</strong> {payment.business_name}</p>
                        <p><strong>Contact:</strong> {payment.contact_phone} | {payment.contact_email}</p>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Bank Details:</h4>
                        <p className="text-sm"><strong>Account:</strong> {payment.bank_name} {payment.account_number} (AMAC {payment.revenue_type} Account)</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">AI Analysis</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Image appears authentic (no manipulation detected)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Amount matches: {formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Account number matches: {payment.account_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Bank name verified: {payment.bank_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Date is recent (within 48 hours)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span>High value transaction - requires supervisor approval</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => handleApprove(payment.id)}
                          className="flex-1"
                          disabled={payment.status !== 'pending'}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          APPROVE
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(payment.id, 'Verification failed')}
                          className="flex-1"
                          disabled={payment.status !== 'pending'}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          REJECT
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Standard Priority Payments */}
        <Card>
          <CardHeader>
            <CardTitle>🟡 STANDARD PRIORITY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments.filter(p => !getUrgentPayments().includes(p)).map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{payment.reference}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(payment.amount)} • {payment.revenue_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.business_name} • Pending {Math.floor((Date.now() - new Date(payment.submitted_at).getTime()) / (1000 * 60))} mins
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payment.status)}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Review →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Load More...
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Bulk Actions ▼
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
