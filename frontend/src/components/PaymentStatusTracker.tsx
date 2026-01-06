import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2, AlertCircle, CreditCard, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface PaymentStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp?: Date;
  icon: React.ReactNode;
}

interface PaymentStatusTrackerProps {
  reference: string;
  onComplete?: (payment: any) => void;
  onFailure?: (error: string) => void;
}

const PaymentStatusTracker = ({ reference, onComplete, onFailure }: PaymentStatusTrackerProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [steps, setSteps] = useState<PaymentStep[]>([
    {
      id: 'initiated',
      label: 'Payment Initiated',
      description: 'Payment request received and validated',
      status: 'pending',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'sent_to_remita',
      label: 'Sent to Remita',
      description: 'Payment sent to Remita for processing',
      status: 'pending',
      icon: <Loader2 className="w-5 h-5" />
    },
    {
      id: 'bank_processing',
      label: 'Bank Processing',
      description: 'Your bank is processing the transaction',
      status: 'pending',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'amount_received',
      label: 'Amount Received',
      description: 'Payment confirmed by your bank',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      id: 'amac_credited',
      label: 'AMAC Account Credited',
      description: 'Funds transferred to AMAC account',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      id: 'receipt_generated',
      label: 'Receipt Generated',
      description: 'Official receipt created and ready',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />
    }
  ]);

  useEffect(() => {
    // Initial payment check
    checkPaymentStatus();

    // Set up real-time subscription for payment updates
    const channel = supabase
      .channel(`payment-${reference}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `reference=eq.${reference}`
      }, (payload) => {
        console.log('Payment update received:', payload);
        updatePaymentStatus(payload.new);
      })
      .subscribe();

    // Set up polling as backup (every 5 seconds)
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [reference]);

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reference', reference)
        .single();

      if (error) throw error;
      updatePaymentStatus(data);
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = (paymentData: any) => {
    setPayment(paymentData);

    const newSteps = [...steps];

    // Update step statuses based on payment data
    switch (paymentData.status) {
      case 'pending':
        // Payment initiated
        newSteps[0] = { ...newSteps[0], status: 'completed', timestamp: new Date(paymentData.created_at) };
        newSteps[1] = { ...newSteps[1], status: 'processing' };
        setCurrentStep(1);
        break;

      case 'processing':
        // Sent to Remita and bank processing
        newSteps[0] = { ...newSteps[0], status: 'completed', timestamp: new Date(paymentData.created_at) };
        newSteps[1] = { ...newSteps[1], status: 'completed' };
        newSteps[2] = { ...newSteps[2], status: 'processing' };
        setCurrentStep(2);
        break;

      case 'confirmed':
        // All steps completed
        newSteps.forEach((step, index) => {
          newSteps[index] = { ...step, status: 'completed' };
        });
        newSteps[5].timestamp = new Date(paymentData.confirmed_at || paymentData.updated_at);
        setCurrentStep(6);

        // Call completion callback
        if (onComplete) {
          onComplete(paymentData);
        }
        break;

      case 'failed':
        // Mark failed steps
        const failedIndex = Math.min(currentStep, 2);
        for (let i = 0; i <= failedIndex; i++) {
          if (newSteps[i].status === 'processing') {
            newSteps[i].status = 'failed';
          }
        }
        setCurrentStep(failedIndex);

        // Call failure callback
        if (onFailure) {
          onFailure('Payment failed. Please try again or contact support.');
        }
        break;
    }

    setSteps(newSteps);
  };

  const getStepIcon = (step: PaymentStep) => {
    const baseClasses = "w-5 h-5";

    switch (step.status) {
      case 'completed':
        return <CheckCircle className={`${baseClasses} text-green-600`} />;
      case 'processing':
        return <Loader2 className={`${baseClasses} text-blue-600 animate-spin`} />;
      case 'failed':
        return <AlertCircle className={`${baseClasses} text-red-600`} />;
      default:
        return <Clock className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Loading payment status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Payment Status for {reference}
        </CardTitle>
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progressPercentage)}% Complete
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-4 p-4 rounded-lg border ${getStatusColor(step.status)}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{step.label}</h4>
                  {step.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {step.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>

                {step.status === 'processing' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      In progress...
                    </div>
                  </div>
                )}

                {step.status === 'completed' && step.timestamp && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Completed at {step.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Payment Details */}
          {payment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-muted/50 rounded-lg"
            >
              <h4 className="font-medium mb-2">Payment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="ml-2 font-medium">₦{payment.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Service:</span>
                  <span className="ml-2 font-medium">{payment.service_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="ml-2 font-mono text-xs">{payment.reference}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RRR:</span>
                  <span className="ml-2 font-mono text-xs">{payment.rrr}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs capitalize ${
                    payment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span>
                  <span className="ml-2 capitalize">{payment.payment_method?.replace('_', ' ') || 'Card'}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estimated Time */}
          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>💡 Usually completes in 30 seconds to 2 minutes</p>
            <p className="mt-1">This page will update automatically</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentStatusTracker;
