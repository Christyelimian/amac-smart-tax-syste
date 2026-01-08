import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatTime } from '@/lib/constants';
import {
  Receipt,
  Download,
  Mail,
  MessageSquare,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Loader2,
  FileText,
  Phone,
} from 'lucide-react';

interface ReceiptItem {
  id: string;
  receiptNumber: string;
  paymentId: string;
  amount: number;
  payerName: string;
  revenueType: string;
  generatedAt: string;
  sentViaEmail: boolean;
  sentViaSms: boolean;
  sentViaWhatsapp: boolean;
  qrValidated: boolean;
  pdfUrl?: string;
  emailSentAt?: string;
  smsSentAt?: string;
  whatsappSentAt?: string;
}

export default function AdminReceipts() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const [receipts, setReceipts] = useState<ReceiptItem[]>([
    {
      id: '1',
      receiptNumber: 'REC-20260107-0045',
      paymentId: 'TEN-20260107-0045',
      amount: 5200000,
      payerName: 'Grand Plaza Shopping Mall',
      revenueType: 'Tenement Rate',
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sentViaEmail: true,
      sentViaSms: true,
      sentViaWhatsapp: false,
      qrValidated: true,
      pdfUrl: '/receipts/rec-20260107-0045.pdf',
      emailSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      smsSentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      receiptNumber: 'REC-20260107-0001',
      paymentId: 'HLR-20260107-0001',
      amount: 180000,
      payerName: 'Transcorp Hilton',
      revenueType: 'Hotel License',
      generatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sentViaEmail: true,
      sentViaSms: false,
      sentViaWhatsapp: true,
      qrValidated: false,
      pdfUrl: '/receipts/rec-20260107-0001.pdf',
      emailSentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      whatsappSentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      receiptNumber: 'REC-20260106-0032',
      paymentId: 'SHP-20260106-0032',
      amount: 45000,
      payerName: 'ABC Traders',
      revenueType: 'Shop License Zone B',
      generatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      sentViaEmail: false,
      sentViaSms: true,
      sentViaWhatsapp: false,
      qrValidated: true,
      pdfUrl: '/receipts/rec-20260106-0032.pdf',
      smsSentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      receiptNumber: 'REC-20260105-0023',
      paymentId: 'POS-20260105-0023',
      amount: 75000,
      payerName: 'XYZ Enterprises',
      revenueType: 'POS License',
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sentViaEmail: true,
      sentViaSms: true,
      sentViaWhatsapp: true,
      qrValidated: false,
    },
  ]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchReceipts();
    }
  }, [user, isAdmin]);

  const fetchReceipts = async () => {
    try {
      // In a real implementation, this would fetch receipts from the database
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setIsLoading(false);
    }
  };

  const handleRegenerateReceipt = async (receiptId: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update receipt with new generation time
      setReceipts(prev => prev.map(receipt =>
        receipt.id === receiptId
          ? {
              ...receipt,
              generatedAt: new Date().toISOString(),
              qrValidated: false,
              sentViaEmail: false,
              sentViaSms: false,
              sentViaWhatsapp: false,
            }
          : receipt
      ));

      setIsLoading(false);
    } catch (error) {
      console.error('Error regenerating receipt:', error);
      setIsLoading(false);
    }
  };

  const handleResendReceipt = async (receiptId: string, channel: 'email' | 'sms' | 'whatsapp') => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const now = new Date().toISOString();
      setReceipts(prev => prev.map(receipt =>
        receipt.id === receiptId
          ? {
              ...receipt,
              [channel === 'email' ? 'sentViaEmail' : channel === 'sms' ? 'sentViaSms' : 'sentViaWhatsapp']: true,
              [channel === 'email' ? 'emailSentAt' : channel === 'sms' ? 'smsSentAt' : 'whatsappSentAt']: now,
            }
          : receipt
      ));

      setIsLoading(false);
    } catch (error) {
      console.error(`Error resending receipt via ${channel}:`, error);
      setIsLoading(false);
    }
  };

  const handleValidateQR = async (receiptId: string) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      setReceipts(prev => prev.map(receipt =>
        receipt.id === receiptId
          ? { ...receipt, qrValidated: true }
          : receipt
      ));

      setIsLoading(false);
    } catch (error) {
      console.error('Error validating QR code:', error);
      setIsLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = !searchTerm ||
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.paymentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'sent' && (receipt.sentViaEmail || receipt.sentViaSms || receipt.sentViaWhatsapp)) ||
      (statusFilter === 'pending' && !receipt.sentViaEmail && !receipt.sentViaSms && !receipt.sentViaWhatsapp) ||
      (statusFilter === 'validated' && receipt.qrValidated) ||
      (statusFilter === 'unvalidated' && !receipt.qrValidated);

    const matchesChannel = channelFilter === 'all' ||
      (channelFilter === 'email' && receipt.sentViaEmail) ||
      (channelFilter === 'sms' && receipt.sentViaSms) ||
      (channelFilter === 'whatsapp' && receipt.sentViaWhatsapp);

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const getDeliveryStatus = (receipt: ReceiptItem) => {
    const channels = [receipt.sentViaEmail, receipt.sentViaSms, receipt.sentViaWhatsapp];
    const sentCount = channels.filter(Boolean).length;

    if (sentCount === 0) return <Badge variant="destructive">Not Sent</Badge>;
    if (sentCount === 1) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partially Sent</Badge>;
    if (sentCount === 3) return <Badge variant="secondary" className="bg-green-100 text-green-800">Fully Sent</Badge>;
    return <Badge variant="secondary">Sent</Badge>;
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
          <h1 className="text-2xl font-display font-bold">🧾 RECEIPTS MANAGEMENT</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Bulk Export
            </Button>
            <Button>
              <Receipt className="h-4 w-4 mr-2" />
              Generate Receipt
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Receipt #, Payer, Payment ID..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="validated">QR Validated</SelectItem>
                    <SelectItem value="unvalidated">QR Unvalidated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Channel</label>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 text-blue-600" />
              <h3 className="font-medium mb-2">Regenerate Receipt</h3>
              <p className="text-sm text-muted-foreground">Create new receipt with updated details</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 mx-auto mb-4 text-green-600" />
              <h3 className="font-medium mb-2">Resend via Email</h3>
              <p className="text-sm text-muted-foreground">Send receipt to payer's email</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Phone className="h-8 w-8 mx-auto mb-4 text-orange-600" />
              <h3 className="font-medium mb-2">Resend via SMS</h3>
              <p className="text-sm text-muted-foreground">Send receipt link via SMS</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <QrCode className="h-8 w-8 mx-auto mb-4 text-purple-600" />
              <h3 className="font-medium mb-2">Validate QR Code</h3>
              <p className="text-sm text-muted-foreground">Verify receipt authenticity</p>
            </CardContent>
          </Card>
        </div>

        {/* Receipts Table */}
        <Card>
          <CardHeader>
            <CardTitle>RECEIPT RECORDS ({filteredReceipts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Delivery Status</TableHead>
                  <TableHead>QR Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono">{receipt.receiptNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{receipt.payerName}</p>
                        <p className="text-sm text-muted-foreground">{receipt.paymentId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(receipt.amount)}</TableCell>
                    <TableCell>{receipt.revenueType}</TableCell>
                    <TableCell>{formatTime(receipt.generatedAt)}</TableCell>
                    <TableCell>{getDeliveryStatus(receipt)}</TableCell>
                    <TableCell>
                      {receipt.qrValidated ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validated
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Unvalidated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" title="View Receipt">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Regenerate"
                          onClick={() => handleRegenerateReceipt(receipt.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {!receipt.sentViaEmail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Resend Email"
                            onClick={() => handleResendReceipt(receipt.id, 'email')}
                            disabled={isLoading}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {!receipt.sentViaSms && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Resend SMS"
                            onClick={() => handleResendReceipt(receipt.id, 'sms')}
                            disabled={isLoading}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        {!receipt.qrValidated && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Validate QR"
                            onClick={() => handleValidateQR(receipt.id)}
                            disabled={isLoading}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-2">Bulk Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Perform actions on multiple receipts at once
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Bulk Email Resend
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Bulk SMS Resend
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Bulk Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
