import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Plus, Calendar, DollarSign, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/constants";

interface RepeatPayment {
  revenue_type_code: string;
  service_name: string;
  icon: string;
  zone_id?: string;
  zone_name?: string;
  zone_multiplier: number;
  is_recurring: boolean;
  renewal_period?: number;
  last_payment: {
    amount: number;
    date: string;
    reference: string;
  };
  total_paid: number;
  payment_count: number;
  business_details: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    registration_number?: string;
  };
  next_due_date?: string;
  can_repeat: boolean;
}

interface RepeatPaymentsProps {
  userIdentifier: string; // phone or email to identify user
  onSelectPayment?: (payment: RepeatPayment) => void;
}

const RepeatPayments = ({ userIdentifier, onSelectPayment }: RepeatPaymentsProps) => {
  const navigate = useNavigate();
  const [repeatPayments, setRepeatPayments] = useState<RepeatPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPaymentHistory();
  }, [userIdentifier]);

  const loadPaymentHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: {},
        headers: {
          'x-identifier': userIdentifier,
        },
      });

      if (error) throw error;

      setRepeatPayments(data.repeat_payments || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeatPayment = (payment: RepeatPayment) => {
    if (onSelectPayment) {
      onSelectPayment(payment);
    } else {
      // Navigate to payment form with pre-filled data
      navigate(`/pay/${payment.revenue_type_code}`, {
        state: {
          repeatPayment: true,
          prefillData: {
            businessName: payment.business_details.name,
            registrationNumber: payment.business_details.registration_number,
            address: payment.business_details.address,
            zone: payment.zone_id,
            contactPerson: payment.business_details.name,
            phone: payment.business_details.phone,
            email: payment.business_details.email,
            amount: payment.last_payment.amount,
            paymentPeriod: 'renewal',
            notes: `Repeat payment - Last paid ${formatDate(payment.last_payment.date)}`,
          }
        }
      });
    }
  };

  const handleBulkPayment = () => {
    if (selectedPayments.size === 0) {
      toast.error('Please select at least one payment');
      return;
    }

    const selectedItems = repeatPayments.filter(p =>
      selectedPayments.has(`${p.revenue_type_code}-${p.zone_id || 'no-zone'}`)
    );

    // Navigate to bulk payment page or handle bulk payment
    navigate('/bulk-payment', {
      state: {
        selectedPayments: selectedItems,
      }
    });
  };

  const togglePaymentSelection = (paymentKey: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentKey)) {
      newSelected.delete(paymentKey);
    } else {
      newSelected.add(paymentKey);
    }
    setSelectedPayments(newSelected);
  };

  const getDaysUntilDue = (dueDate?: string): number | null => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueStatus = (daysUntilDue: number | null): { status: string; color: string } => {
    if (daysUntilDue === null) return { status: 'Unknown', color: 'gray' };
    if (daysUntilDue < 0) return { status: 'Overdue', color: 'red' };
    if (daysUntilDue <= 7) return { status: 'Due Soon', color: 'orange' };
    if (daysUntilDue <= 30) return { status: 'Upcoming', color: 'blue' };
    return { status: 'Future', color: 'green' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading your payment history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (repeatPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repeat Payments</CardTitle>
          <CardDescription>
            Your recurring payment history will appear here for quick renewal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recurring payments found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete your first payment to enable repeat payments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Repeat Payments
              </CardTitle>
              <CardDescription>
                Quickly renew your recurring payments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadPaymentHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>{repeatPayments.length} recurring payment{repeatPayments.length !== 1 ? 's' : ''}</span>
            <span>Total paid: {formatCurrency(repeatPayments.reduce((sum, p) => sum + p.total_paid, 0))}</span>
          </div>

          {/* Bulk Payment Option */}
          {selectedPayments.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {selectedPayments.size} payment{selectedPayments.size !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pay all together and save time
                  </p>
                </div>
                <Button onClick={handleBulkPayment} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Pay Together ({formatCurrency(
                    repeatPayments
                      .filter(p => selectedPayments.has(`${p.revenue_type_code}-${p.zone_id || 'no-zone'}`))
                      .reduce((sum, p) => sum + p.last_payment.amount, 0)
                  )})
                </Button>
              </div>
            </motion.div>
          )}

          {/* Payment List */}
          <div className="space-y-3">
            {repeatPayments.map((payment) => {
              const paymentKey = `${payment.revenue_type_code}-${payment.zone_id || 'no-zone'}`;
              const isSelected = selectedPayments.has(paymentKey);
              const daysUntilDue = getDaysUntilDue(payment.next_due_date);
              const dueStatus = getDueStatus(daysUntilDue);

              return (
                <motion.div
                  key={paymentKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Selection Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePaymentSelection(paymentKey)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                      </div>

                      {/* Payment Icon */}
                      <div className="text-2xl">{payment.icon}</div>

                      {/* Payment Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{payment.service_name}</h4>
                          {payment.zone_name && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {payment.zone_name}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Last paid: {formatCurrency(payment.last_payment.amount)} on {formatDate(payment.last_payment.date)}</div>
                          <div>Total paid: {formatCurrency(payment.total_paid)} ({payment.payment_count} payment{payment.payment_count !== 1 ? 's' : ''})</div>
                          {payment.next_due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Next due: {formatDate(payment.next_due_date)}
                              <Badge
                                variant="outline"
                                className={`text-xs ml-2 ${
                                  dueStatus.color === 'red' ? 'border-red-200 text-red-700' :
                                  dueStatus.color === 'orange' ? 'border-orange-200 text-orange-700' :
                                  dueStatus.color === 'blue' ? 'border-blue-200 text-blue-700' :
                                  'border-green-200 text-green-700'
                                }`}
                              >
                                {dueStatus.status}
                                {daysUntilDue !== null && daysUntilDue >= 0 && ` (${daysUntilDue}d)`}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRepeatPayment(payment)}
                        className="whitespace-nowrap"
                      >
                        Pay Again
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>

                      {daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0 && (
                        <div className="text-xs text-orange-600 font-medium">
                          Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                        </div>
                      )}

                      {daysUntilDue !== null && daysUntilDue < 0 && (
                        <div className="text-xs text-red-600 font-medium">
                          {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepeatPayments;
