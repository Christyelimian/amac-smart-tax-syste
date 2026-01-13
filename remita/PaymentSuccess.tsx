import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, Mail, Smartphone, QrCode, Home, ArrowRight, Copy, Check, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentDetails {
  success: boolean;
  status: string;
  reference: string;
  rrr?: string;
  receipt_number: string | null;
  amount: number;
  payer_name: string;
  service_name: string;
  payment_method: string;
  paid_at: string;
  message: string;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get reference from URL params (Paystack uses both 'reference' and 'trxref')
  const reference = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref");
  const rrr = searchParams.get("rrr");
  const gateway = searchParams.get("gateway") || (rrr ? 'remita' : 'paystack');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !rrr) {
        setError("No payment reference found");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verifying payment for reference:", reference, "RRR:", rrr, "Gateway:", gateway);
        
        // Use appropriate verification endpoint based on gateway
        const verifyEndpoint = gateway === 'remita' ? 'verify-remita' : 'verify-payment';
        
        const { data, error: funcError } = await supabase.functions.invoke(verifyEndpoint, {
          body: { reference, rrr },
        });

        if (funcError) {
          console.error("Verification error:", funcError);
          throw new Error(funcError.message || "Failed to verify payment");
        }

        console.log("Verification response:", data);
        setPaymentDetails(data);

        // Trigger confetti only on success
        if (data?.success) {
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
          }

          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
              colors: ["#006838", "#10B981", "#ffffff"],
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
              colors: ["#006838", "#10B981", "#ffffff"],
            });
          }, 250);

          setTimeout(() => clearInterval(interval), duration);
        }

      } catch (err) {
        console.error("Payment verification failed:", err);
        setError(err instanceof Error ? err.message : "Failed to verify payment");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [reference, rrr, gateway]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentDate = paymentDetails?.paid_at 
    ? new Date(paymentDetails.paid_at).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const paymentTime = paymentDetails?.paid_at
    ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Verifying Payment...</h1>
            <p className="text-muted-foreground">Please wait while we confirm your transaction</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !paymentDetails) {
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
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-muted-foreground mb-6">{error || "Unable to verify payment"}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/services">Try Again</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Failed payment state
  if (!paymentDetails.success) {
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
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-warning" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Not Completed</h1>
              <p className="text-muted-foreground mb-4">{paymentDetails.message}</p>
              <p className="text-sm text-muted-foreground mb-6">Reference: {paymentDetails.reference}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/services">Try Again</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const timeline = [
    { label: "Payment initiated", time: paymentTime, done: true },
    { label: "Sent to Paystack", time: paymentTime, done: true },
    { label: "Bank processing", time: paymentTime, done: true },
    { label: "Amount received", time: paymentTime, done: true },
    { label: "AMAC account credited", time: paymentTime, done: true },
    { label: "Receipt generated", time: paymentTime, done: true },
  ];

  // Success state
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center"
            >
              <CheckCircle2 className="w-14 h-14 text-success" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              Payment Successful! 🎉
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              Your payment has been confirmed and recorded.
            </motion.p>
          </motion.div>

          {/* Payment Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
          >
            <div className="bg-success/10 p-6 text-center border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {formatAmount(paymentDetails.amount)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receipt Number</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    {paymentDetails.receipt_number || "Processing..."}
                    {paymentDetails.receipt_number && (
                      <button
                        onClick={() => handleCopy(paymentDetails.receipt_number!)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transaction Ref</p>
                  <p className="font-medium text-foreground text-xs font-mono">{paymentDetails.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payer Name</p>
                  <p className="font-medium text-foreground">{paymentDetails.payer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Revenue Type</p>
                  <p className="font-medium text-foreground">{paymentDetails.service_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium text-foreground capitalize">{paymentDetails.payment_method || "Card"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid Period</p>
                  <p className="font-medium text-foreground">Jan 2026 - Dec 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Date</p>
                  <p className="font-medium text-foreground">{paymentDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Time</p>
                  <p className="font-medium text-foreground">{paymentTime}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-2xl border border-border p-6 mb-6"
          >
            <h3 className="font-semibold text-foreground mb-4">Payment Timeline</h3>
            <div className="space-y-3">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-center">
              <p className="text-sm text-success font-medium">
                ⚡ Payment confirmed instantly
              </p>
            </div>
          </motion.div>

          {/* Receipt Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card rounded-2xl border border-border p-6 mb-6"
          >
            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2 text-success">
                <Mail className="w-4 h-4" />
                <span>Email receipt sent</span>
              </div>
              <div className="flex items-center gap-2 text-success">
                <Smartphone className="w-4 h-4" />
                <span>SMS receipt sent</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="flex-1 rounded-xl">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl">
                <Mail className="w-4 h-4 mr-2" />
                Email Again
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl">
                <Smartphone className="w-4 h-4 mr-2" />
                SMS Again
              </Button>
            </div>
          </motion.div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-card rounded-2xl border border-border p-6 mb-6 text-center"
          >
            <div className="w-32 h-32 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center">
              <QrCode className="w-20 h-20 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Scan to verify this receipt is authentic
            </p>
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-6"
          >
            <h3 className="font-semibold text-foreground mb-4">💡 What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                Your payment is complete and recorded
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                Keep this receipt for your records
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                Your license is now valid until December 31, 2026
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                We'll remind you when renewal is due
              </li>
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button asChild variant="outline" size="lg" className="flex-1 rounded-xl">
              <Link to="/services">
                Make Another Payment <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" className="flex-1 rounded-xl">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" /> Go Home
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
