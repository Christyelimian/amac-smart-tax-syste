import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import {
  Building,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  FileBarChart,
  Loader2,
  Link,
  Unlink,
} from 'lucide-react';

interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  bankReference: string;
  systemReference?: string;
  status: 'matched' | 'unmatched' | 'pending' | 'discrepancy';
  bankName: string;
  accountNumber: string;
  transactionType: 'credit' | 'debit';
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isConnected: boolean;
  lastSync: string;
  balance: number;
}

export default function AdminBankReconciliation() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('january-2026');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Zenith Bank',
      accountNumber: '1213862799',
      accountName: 'AMAC Tenement Rate Account',
      isConnected: true,
      lastSync: new Date().toISOString(),
      balance: 45200000,
    },
    {
      id: '2',
      bankName: 'First Bank',
      accountNumber: '0987654321',
      accountName: 'AMAC General Revenue Account',
      isConnected: true,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      balance: 12800000,
    },
    {
      id: '3',
      bankName: 'Access Bank',
      accountNumber: '1234567890',
      accountName: 'AMAC POS License Account',
      isConnected: false,
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      balance: 8500000,
    },
  ]);

  const [reconciliationItems, setReconciliationItems] = useState<ReconciliationItem[]>([
    {
      id: '1',
      date: '2026-01-07',
      description: 'Tenement Rate Payment - Grand Plaza',
      amount: 5200000,
      bankReference: 'FT26007234567',
      systemReference: 'TEN-20260107-0045',
      status: 'matched',
      bankName: 'Zenith Bank',
      accountNumber: '1213862799',
      transactionType: 'credit',
    },
    {
      id: '2',
      date: '2026-01-07',
      description: 'Hotel License - Transcorp Hilton',
      amount: 180000,
      bankReference: 'FT26007180001',
      systemReference: 'HLR-20260107-0001',
      status: 'matched',
      bankName: 'Zenith Bank',
      accountNumber: '1213862799',
      transactionType: 'credit',
    },
    {
      id: '3',
      date: '2026-01-06',
      description: 'POS License Payment',
      amount: 45000,
      bankReference: 'FT26006450032',
      status: 'unmatched',
      bankName: 'First Bank',
      accountNumber: '0987654321',
      transactionType: 'credit',
    },
    {
      id: '4',
      date: '2026-01-06',
      description: 'Bank Charges',
      amount: 2500,
      bankReference: 'CHG26006123456',
      status: 'discrepancy',
      bankName: 'Zenith Bank',
      accountNumber: '1213862799',
      transactionType: 'debit',
    },
    {
      id: '5',
      date: '2026-01-05',
      description: 'Shop License Payment - Zone B',
      amount: 75000,
      bankReference: 'FT26005750089',
      systemReference: 'SHP-20260105-0023',
      status: 'pending',
      bankName: 'First Bank',
      accountNumber: '0987654321',
      transactionType: 'credit',
    },
  ]);

  const [reconciliationSummary, setReconciliationSummary] = useState({
    totalBankCredits: 5375000,
    totalSystemCredits: 5380000,
    totalBankDebits: 2500,
    totalSystemDebits: 0,
    matchedItems: 2,
    unmatchedItems: 1,
    discrepancyItems: 1,
    pendingItems: 1,
    reconciledBalance: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchReconciliationData();
    }
  }, [user, isAdmin, selectedDate]);

  const fetchReconciliationData = async () => {
    try {
      // In a real implementation, this would fetch reconciliation data
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      setIsLoading(false);
    }
  };

  const handleAutoReconcile = async () => {
    try {
      // Simulate auto-reconciliation process
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update some items to matched status
      setReconciliationItems(prev => prev.map(item =>
        item.status === 'pending' ? { ...item, status: 'matched' as const } : item
      ));

      setReconciliationSummary(prev => ({
        ...prev,
        matchedItems: prev.matchedItems + prev.pendingItems,
        pendingItems: 0,
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error auto-reconciling:', error);
      setIsLoading(false);
    }
  };

  const handleConnectBank = async (accountId: string) => {
    // Simulate bank connection
    setBankAccounts(prev => prev.map(account =>
      account.id === accountId
        ? { ...account, isConnected: true, lastSync: new Date().toISOString() }
        : account
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ Matched</Badge>;
      case 'unmatched':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Unmatched</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">⏳ Pending</Badge>;
      case 'discrepancy':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">❌ Discrepancy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredItems = reconciliationItems.filter(item => {
    if (selectedStatus === 'all') return true;
    return item.status === selectedStatus;
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
          <h1 className="text-2xl font-display font-bold">🏦 BANK RECONCILIATION CENTER</h1>
          <div className="flex items-center gap-4">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january-2026">January 2026</SelectItem>
                <SelectItem value="december-2025">December 2025</SelectItem>
                <SelectItem value="november-2025">November 2025</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="discrepancy">Discrepancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reconciliation Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Bank Credits</h3>
                <Building className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                {formatCurrency(reconciliationSummary.totalBankCredits)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">System Credits</h3>
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-display font-bold text-blue-600">
                {formatCurrency(reconciliationSummary.totalSystemCredits)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Matched Items</h3>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-display font-bold text-green-600">
                {reconciliationSummary.matchedItems}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold">Discrepancies</h3>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-display font-bold text-red-600">
                {reconciliationSummary.discrepancyItems}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Connections */}
        <Card>
          <CardHeader>
            <CardTitle>CONNECTED BANK ACCOUNTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.bankName}</p>
                      <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">{account.accountName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(account.balance)}</p>
                      <p className="text-xs text-muted-foreground">
                        Last sync: {formatTime(account.lastSync)}
                      </p>
                    </div>
                    <Badge variant={account.isConnected ? "secondary" : "destructive"}>
                      {account.isConnected ? '✅ Connected' : '❌ Disconnected'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectBank(account.id)}
                      disabled={account.isConnected}
                    >
                      {account.isConnected ? (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Unlink className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auto Reconcile Actions */}
        <Card>
          <CardHeader>
            <CardTitle>AUTO RECONCILIATION</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Automatically match bank transactions with system records
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Pending items: {reconciliationSummary.pendingItems}</span>
                  <span>Unmatched items: {reconciliationSummary.unmatchedItems}</span>
                  <span>Discrepancies: {reconciliationSummary.discrepancyItems}</span>
                </div>
              </div>
              <Button onClick={handleAutoReconcile} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Auto Reconcile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Table */}
        <Card>
          <CardHeader>
            <CardTitle>RECONCILIATION ITEMS</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Reference</TableHead>
                  <TableHead>System Reference</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className={item.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {item.transactionType === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.bankReference}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.systemReference || '-'}
                    </TableCell>
                    <TableCell>{item.bankName}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Upload className="h-4 w-4 mr-2" />
              Import Bank Statement
            </Button>
          </div>
          <Button>
            <FileBarChart className="h-4 w-4 mr-2" />
            Reconciliation Report
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
