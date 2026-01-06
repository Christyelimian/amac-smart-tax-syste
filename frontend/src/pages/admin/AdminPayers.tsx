import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/constants';
import {
  Search,
  Users,
  Loader2,
  Eye,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Payer {
  email: string;
  name: string;
  phone: string | null;
  totalPaid: number;
  transactionCount: number;
  lastPayment: string;
  status: 'active' | 'inactive' | 'defaulter';
}

interface PayerPayment {
  id: string;
  reference: string;
  service_name: string;
  amount: number;
  status: string;
  created_at: string;
  zone: string;
}

export default function AdminPayers() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [payers, setPayers] = useState<Payer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Payer detail modal
  const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
  const [payerPayments, setPayerPayments] = useState<PayerPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchPayers();
    }
  }, [user, isAdmin]);

  const fetchPayers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all payments grouped by payer
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!payments) return;

      // Aggregate by email
      const payerMap: Record<string, Payer> = {};
      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      payments.forEach((p) => {
        const email = p.payer_email || p.payer_name;
        if (!payerMap[email]) {
          payerMap[email] = {
            email: p.payer_email || '',
            name: p.payer_name,
            phone: p.payer_phone,
            totalPaid: 0,
            transactionCount: 0,
            lastPayment: p.created_at,
            status: 'inactive',
          };
        }
        
        if (p.status === 'confirmed') {
          payerMap[email].totalPaid += Number(p.amount);
        }
        payerMap[email].transactionCount++;
        
        if (new Date(p.created_at) > new Date(payerMap[email].lastPayment)) {
          payerMap[email].lastPayment = p.created_at;
        }
      });

      // Determine status
      Object.values(payerMap).forEach((payer) => {
        const lastPaymentDate = new Date(payer.lastPayment);
        if (lastPaymentDate >= ninetyDaysAgo) {
          payer.status = 'active';
        } else if (lastPaymentDate >= new Date(now.setMonth(now.getMonth() - 6))) {
          payer.status = 'inactive';
        } else {
          payer.status = 'defaulter';
        }
      });

      setPayers(Object.values(payerMap).sort((a, b) => b.totalPaid - a.totalPaid));
    } catch (error) {
      console.error('Error fetching payers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayerPayments = async (email: string) => {
    try {
      setIsLoadingPayments(true);
      
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_email', email)
        .order('created_at', { ascending: false })
        .limit(20);

      setPayerPayments(data as PayerPayment[] || []);
    } catch (error) {
      console.error('Error fetching payer payments:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleViewPayer = (payer: Payer) => {
    setSelectedPayer(payer);
    fetchPayerPayments(payer.email);
  };

  const filteredPayers = useMemo(() => {
    return payers.filter((payer) => {
      const matchesSearch =
        !searchQuery ||
        payer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payer.phone?.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || payer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payers, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: payers.length,
      active: payers.filter((p) => p.status === 'active').length,
      inactive: payers.filter((p) => p.status === 'inactive').length,
      defaulters: payers.filter((p) => p.status === 'defaulter').length,
    };
  }, [payers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'defaulter':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Defaulter
          </Badge>
        );
      default:
        return null;
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
        <div>
          <h1 className="text-3xl font-display font-bold">Payers</h1>
          <p className="text-muted-foreground">
            Manage and view all taxpayers and their payment history
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payers</p>
                  <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold">{stats.inactive.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Defaulters</p>
                  <p className="text-2xl font-bold">{stats.defaulters.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  <TabsTrigger value="defaulter">Defaulters</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Payers Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayers.map((payer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{payer.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {payer.email || 'N/A'}
                          </div>
                          {payer.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {payer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payer.totalPaid)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{payer.transactionCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(payer.lastPayment)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payer.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPayer(payer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payer Detail Modal */}
      <Dialog open={!!selectedPayer} onOpenChange={() => setSelectedPayer(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Payer Profile</DialogTitle>
          </DialogHeader>
          {selectedPayer && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedPayer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedPayer.name}</h3>
                    {getStatusBadge(selectedPayer.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedPayer.totalPaid)}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedPayer.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedPayer.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-sm font-medium">{selectedPayer.transactionCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Payment</p>
                    <p className="text-sm font-medium">{formatDate(selectedPayer.lastPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-semibold mb-3">Payment History</h4>
                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : payerPayments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payments found</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {payerPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{payment.service_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.created_at)} • Zone {payment.zone.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          <Badge
                            variant={payment.status === 'confirmed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
