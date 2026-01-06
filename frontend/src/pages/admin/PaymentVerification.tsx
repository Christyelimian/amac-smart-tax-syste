import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Payment {
  id: string;
  reference: string;
  service_name: string;
  amount: number;
  status: string;
  payment_method: string;
  proof_of_payment_url: string;
  submitted_at: string;
  customer_details: {
    businessName: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PaymentVerification = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (isAdmin) {
      fetchPendingPayments();
    }
  }, [isAdmin]);

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('status', ['pending_verification', 'awaiting_verification'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const businessName = (() => {
      try {
        const notes = payment.notes ? JSON.parse(payment.notes) : null;
        return notes?.customer_details?.businessName || payment.payer_name;
      } catch {
        return payment.payer_name;
      }
    })();

    const matchesSearch = searchQuery === "" ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.service_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleVerification = async (paymentId: string, approved: boolean) => {
    setVerifyingPaymentId(paymentId);

    try {
      // Get full payment details first
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        status: approved ? 'confirmed' : 'rejected',
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
        verification_notes: verificationNotes.trim() || null
      };

      // For approved bank transfers, update additional fields
      if (approved && payment.payment_method === 'bank_transfer') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.bank_confirmed = true;
        updateData.bank_confirmed_at = new Date().toISOString();
        updateData.reconciled = true;
        updateData.reconciled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // Create reconciliation log for approved bank transfers
      if (approved && payment.payment_method === 'bank_transfer') {
        try {
          await supabase
            .from('reconciliation_log')
            .insert({
              payment_id: payment.id,
              remita_amount: payment.amount,
              bank_amount: payment.amount,
              bank_reference: `BANK-${payment.reference}`,
              matched: true,
              resolved: true,
              resolved_at: new Date().toISOString(),
              notes: `Manually verified by admin ${user?.email || 'Unknown'} - ${verificationNotes || 'No notes'}`,
            });
        } catch (reconciliationError) {
          console.warn('Failed to create reconciliation log:', reconciliationError);
        }
      }

      // Send confirmation email/SMS via edge function
      if (approved) {
        try {
          const customerEmail = (() => {
            try {
              const notes = payment?.notes ? JSON.parse(payment.notes) : null;
              return notes?.customer_details?.email || payment?.payer_email;
            } catch {
              return payment?.payer_email;
            }
          })();

          const customerPhone = (() => {
            try {
              const notes = payment?.notes ? JSON.parse(payment.notes) : null;
              return notes?.customer_details?.phone || payment?.payer_phone;
            } catch {
              return payment?.payer_phone;
            }
          })();

          await supabase.functions.invoke('send-payment-confirmation', {
            body: {
              paymentId,
              customerEmail,
              customerPhone
            }
          });
        } catch (emailError) {
          console.warn('Failed to send confirmation:', emailError);
        }
      }

      toast.success(approved ? 'Payment approved successfully!' : 'Payment rejected');
      setSelectedPayment(null);
      setVerificationNotes("");
      fetchPendingPayments();

    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to process verification');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'awaiting_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Submitted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Payment Verification</h1>
            <p className="text-muted-foreground">Review and approve bank transfer payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {filteredPayments.length} pending
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, business name, or service..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending_verification">Pending</option>
                <option value="awaiting_verification">Submitted</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground text-center">
                No pending payment verifications at the moment.
                New bank transfers will appear here for review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{payment.customer_details?.businessName}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {payment.service_name} • {formatAmount(payment.amount)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{payment.reference}</span>
                        <span>•</span>
                        <span>{formatDate(payment.submitted_at)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary mb-1">
                        {formatAmount(payment.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">Bank Transfer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Verify Payment - {payment.reference}</DialogTitle>
                          <DialogDescription>
                            Review the uploaded proof of payment and customer details
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                          {/* Payment Details */}
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Business Name</p>
                              <p className="text-sm">{(() => {
                                try {
                                  const notes = payment.notes ? JSON.parse(payment.notes) : null;
                                  return notes?.customer_details?.businessName || payment.payer_name;
                                } catch {
                                  return payment.payer_name;
                                }
                              })()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Contact Person</p>
                              <p className="text-sm">{(() => {
                                try {
                                  const notes = payment.notes ? JSON.parse(payment.notes) : null;
                                  return notes?.customer_details?.contactPerson || payment.payer_name || 'N/A';
                                } catch {
                                  return payment.payer_name || 'N/A';
                                }
                              })()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Phone</p>
                              <p className="text-sm">{(() => {
                                try {
                                  const notes = payment.notes ? JSON.parse(payment.notes) : null;
                                  return notes?.customer_details?.phone || payment.payer_phone;
                                } catch {
                                  return payment.payer_phone;
                                }
                              })()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Amount</p>
                              <p className="text-lg font-bold text-primary">{formatAmount(payment.amount)}</p>
                            </div>
                          </div>

                          {/* Proof of Payment */}
                          {payment.proof_of_payment_url && (
                            <div>
                              <h4 className="font-medium mb-2">Proof of Payment</h4>
                              <div className="border rounded-lg overflow-hidden">
                                <img
                                  src={payment.proof_of_payment_url}
                                  alt="Proof of payment"
                                  className="w-full max-h-96 object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Verification Notes */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Verification Notes (Optional)
                            </label>
                            <Textarea
                              placeholder="Add any notes about this verification..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleVerification(payment.id, false)}
                              variant="destructive"
                              disabled={verifyingPaymentId === payment.id}
                              className="flex-1"
                            >
                              {verifyingPaymentId === payment.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject Payment
                            </Button>
                            <Button
                              onClick={() => handleVerification(payment.id, true)}
                              disabled={verifyingPaymentId === payment.id}
                              className="flex-1"
                            >
                              {verifyingPaymentId === payment.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve Payment
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending_verification').length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === 'awaiting_verification').length}</p>
                  <p className="text-sm text-muted-foreground">Proof Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    ₦{payments.reduce((sum, p) => sum + (p.status === 'awaiting_verification' ? p.amount : 0), 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentVerification;
