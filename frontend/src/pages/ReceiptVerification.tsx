import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Shield, Calendar, DollarSign, User, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VerificationResult {
  isAuthentic: boolean;
  receiptNumber: string;
  paymentDetails?: {
    reference: string;
    amount: number;
    payer_name: string;
    service_name: string;
    payment_method: string;
    paid_at: string;
    status: string;
  };
  errorMessage?: string;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ReceiptVerification = () => {
  const [searchParams] = useSearchParams();
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const receiptNumber = searchParams.get("receipt");

  useEffect(() => {
    const verifyReceipt = async () => {
      if (!receiptNumber) {
        setError("No receipt number provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verifying receipt:", receiptNumber);

        const { data: receipt, error: receiptError } = await supabase
          .from('receipts')
          .select(`
            *,
            payments (
              reference,
              amount,
              payer_name,
              service_name,
              payment_method,
              paid_at,
              status
            )
          `)
          .eq('receipt_number', receiptNumber)
          .single();

        if (receiptError || !receipt) {
          setVerificationResult({
            isAuthentic: false,
            receiptNumber,
            errorMessage: "Receipt not found in our records",
          });
          return;
        }

        if (receipt.payments && receipt.payments.length > 0) {
          const payment = receipt.payments[0];
          setVerificationResult({
            isAuthentic: true,
            receiptNumber,
            paymentDetails: {
              reference: payment.reference,
              amount: payment.amount,
              payer_name: payment.payer_name,
              service_name: payment.service_name,
              payment_method: payment.payment_method,
              paid_at: payment.paid_at,
              status: payment.status,
            },
          });
        } else {
          setVerificationResult({
            isAuthentic: false,
            receiptNumber,
            errorMessage: "Payment details not found for this receipt",
          });
        }

      } catch (err) {
        console.error("Receipt verification failed:", err);
        setError("Failed to verify receipt. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyReceipt();
  }, [receiptNumber]);

  const paymentDate = verificationResult?.paymentDetails?.paid_at
    ? new Date(verificationResult.paymentDetails.paid_at).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : '';

  const paymentTime = verificationResult?.paymentDetails?.paid_at
    ? new Date(verificationResult.paymentDetails.paid_at).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Verifying Receipt</h2>
            <p className="text-muted-foreground">Please wait while we authenticate this receipt...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-2xl p-8 border border-border"
            >
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                verificationResult?.isAuthentic 
                  ? 'bg-success/10' 
                  : 'bg-destructive/10'
              }`}
            >
              {verificationResult?.isAuthentic ? (
                <CheckCircle className="w-14 h-14 text-success" />
              ) : (
                <XCircle className="w-14 h-14 text-destructive" />
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              {verificationResult?.isAuthentic ? (
                <>
                  <Shield className="inline-block w-8 h-8 mr-2 text-success" />
                  Receipt is Authentic
                </>
              ) : (
                <>
                  <Shield className="inline-block w-8 h-8 mr-2 text-destructive" />
                  Receipt Verification Failed
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              {verificationResult?.isAuthentic
                ? "This receipt has been verified and is authentic."
                : verificationResult?.errorMessage || "This receipt could not be verified."}
            </motion.p>
          </motion.div>

          {verificationResult?.isAuthentic && verificationResult.paymentDetails && (
            <>
              {/* Payment Details Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
              >
                <div className="bg-success/10 p-6 text-center border-b border-border">
                  <p className="text-sm text-muted-foreground mb-1">Receipt Number</p>
                  <p className="text-2xl font-bold text-foreground">{verificationResult.receiptNumber}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Transaction Ref</p>
                        <p className="font-medium text-foreground">{verificationResult.paymentDetails.reference}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Payer Name</p>
                        <p className="font-medium text-foreground">{verificationResult.paymentDetails.payer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Amount Paid</p>
                        <p className="font-medium text-foreground">{formatAmount(verificationResult.paymentDetails.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Revenue Type</p>
                        <p className="font-medium text-foreground">{verificationResult.paymentDetails.service_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Payment Date</p>
                        <p className="font-medium text-foreground">{paymentDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Payment Time</p>
                        <p className="font-medium text-foreground">{paymentTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Verification Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-success/5 border border-success/20 rounded-2xl p-6 mb-6"
              >
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  Verification Details
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Receipt is officially registered in AMAC system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Payment has been confirmed and processed
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Receipt is valid and tamper-proof
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                  Verified on {new Date().toLocaleDateString("en-NG", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </li>
                </ul>
              </motion.div>
            </>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button variant="outline" size="lg" className="flex-1 rounded-xl" onClick={() => window.print()}>
              Print Verification
            </Button>
            <Button asChild size="lg" className="flex-1 rounded-xl">
              <a href="https://smarttax.com.ng" target="_blank" rel="noopener noreferrer">
                Visit AMAC Website
              </a>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReceiptVerification;