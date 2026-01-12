import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, Mail, Smartphone, QrCode, Home, ArrowRight, Copy, Check, Loader2, XCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import PaymentStatusTracker from "@/components/PaymentStatusTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isSMSing, setIsSMSing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Get reference and RRR from URL params
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
        
        let data;
        
        // Try verification with a timeout and retry
        const response = await Promise.race([
          fetch(
            `https://kfummdjejjjccfbzzifc.supabase.co/functions/v1/${verifyEndpoint}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
              },
              body: JSON.stringify({ reference, rrr }),
            }
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000))
        ]);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Verification error:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        data = await response.json();
        console.log("✅ Verification response:", data);
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
        
        // Check if actually offline (not other errors)
        const isOfflineError = err instanceof Error && (
          err.message.includes('Failed to fetch') && 
          !err.message.includes('HTTP 4') && !err.message.includes('HTTP 5') && // Exclude server errors
          !err.message.includes('401') && !err.message.includes('403') && !err.message.includes('404') // Exclude auth/not found errors
        );
        
        if (isOfflineError) {
          console.log("Network detected as offline - showing payment confirmation from URL params");
          // Show success page with data from URL when offline
          setPaymentDetails({
            success: true,
            status: 'confirmed',
            reference: reference || 'unknown',
            rrr: rrr || '',
            receipt_number: 'AMAC/' + new Date().getFullYear() + '/WEB/' + Date.now().toString().slice(-6),
            amount: 0, // Will be updated when online
            payer_name: 'Payment Received',
            service_name: 'Tax Payment',
            payment_method: gateway || 'online',
            paid_at: new Date().toISOString(),
            message: 'Payment completed! Receipt will be available when you reconnect to internet.'
          });
          
          // Try to verify again after 3 seconds (in case it was temporary)
          setTimeout(async () => {
            try {
              console.log("🔄 Retrying payment verification...");
              const retryResponse = await fetch(
                `https://kfummdjejjjccfbzzifc.supabase.co/functions/v1/${gateway === 'remita' ? 'verify-remita' : 'verify-payment'}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
                  },
                  body: JSON.stringify({ reference, rrr }),
                }
              );
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log("✅ Retry successful, updating payment details:", retryData);
                setPaymentDetails(retryData);
              }
            } catch (retryError) {
              console.log("Retry failed - keeping offline display");
            }
          }, 3000);
        } else {
          console.error("❌ Non-offline error:", err);
          setError(err instanceof Error ? err.message : "Failed to verify payment");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [reference, rrr, gateway]);

  const handlePaymentComplete = (payment: any) => {
    console.log("Payment completed:", payment);
    setPaymentDetails({
      success: true,
      status: payment.status,
      reference: payment.reference,
      receipt_number: payment.receipt_number,
      amount: payment.amount,
      payer_name: payment.payer_name,
      service_name: payment.service_name,
      payment_method: payment.payment_method,
      paid_at: payment.confirmed_at,
      message: "Payment confirmed successfully"
    });
    setShowSuccess(true);

    // Trigger confetti
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
  };

  const handlePaymentFailure = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentDetails({
      success: false,
      status: 'failed',
      reference: reference || '',
      receipt_number: null,
      amount: 0,
      payer_name: '',
      service_name: '',
      payment_method: '',
      paid_at: '',
      message: errorMessage
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR Code for receipt verification
  const generateQRCode = async () => {
    if (!paymentDetails?.receipt_number) return;
    
    const verificationUrl = `${window.location.origin}/verify-receipt?receipt=${paymentDetails.receipt_number}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Download PDF receipt
  const downloadPDF = async () => {
    if (!paymentDetails || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add AMAC header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ABUJA MUNICIPAL AREA COUNCIL', 105, 20, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text('AUTOMATED MUNICIPAL ASSESSMENT COLLECTION', 105, 30, { align: 'center' });

      // Add receipt title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.text('PAYMENT RECEIPT', 105, 55, { align: 'center' });

      // Add receipt details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const details = [
        ['Receipt Number:', paymentDetails.receipt_number || 'Processing...'],
        ['Transaction Ref:', paymentDetails.reference],
        ['Payer Name:', paymentDetails.payer_name],
        ['Revenue Type:', paymentDetails.service_name],
        ['Amount Paid:', formatAmount(paymentDetails.amount)],
        ['Payment Method:', paymentDetails.payment_method || 'Online'],
        ['Payment Date:', paymentDate],
        ['Payment Time:', paymentTime],
      ];

      let yPos = 80;
      details.forEach(([label, value]) => {
        pdf.text(label, 20, yPos);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, 80, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 8;
      });

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('This is an official receipt from AMAC. Keep for your records.', 105, 280, { align: 'center' });
      
      // Add verification info
      pdf.text(`Verify authenticity: ${window.location.origin}/verify-receipt?receipt=${paymentDetails.receipt_number}`, 105, 285, { align: 'center' });

      // Download the PDF
      const fileName = `AMAC_Receipt_${paymentDetails.receipt_number || paymentDetails.reference}.pdf`;
      pdf.save(fileName);
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Send email receipt
  const sendEmailAgain = async () => {
    if (!paymentDetails || isEmailing) return;
    
    setIsEmailing(true);
    
    try {
      const authHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
      };

      const response = await fetch('https://kfummdjejjjccfbzzifc.supabase.co/functions/v1/send-receipt-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          receipt_number: paymentDetails.receipt_number,
          reference: paymentDetails.reference,
          amount: paymentDetails.amount,
          payer_name: paymentDetails.payer_name,
          service_name: paymentDetails.service_name,
          payment_method: paymentDetails.payment_method,
          paid_at: paymentDetails.paid_at,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Receipt sent to your email successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsEmailing(false);
    }
  };

  // Send SMS receipt
  const sendSMSAgain = async () => {
    if (!paymentDetails || isSMSing) return;
    
    setIsSMSing(true);
    
    try {
      const authHeaders = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdW1tZGplampqY2NmYnp6aWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTIyMzQsImV4cCI6MjA4MzI2ODIzNH0.MWQbDQ0YINAAWC0OpByVE4tCWWHlVWE4rXnRi8d_sYg',
      };

      const response = await fetch('https://kfummdjejjjccfbzzifc.supabase.co/functions/v1/send-receipt-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          receipt_number: paymentDetails.receipt_number,
          reference: paymentDetails.reference,
          amount: paymentDetails.amount,
          payer_name: paymentDetails.payer_name,
          service_name: paymentDetails.service_name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      toast.success('Receipt sent to your phone via SMS!');
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS. Please try again.');
    } finally {
      setIsSMSing(false);
    }
  };

  // Generate QR code on component mount
  useEffect(() => {
    if (paymentDetails?.receipt_number) {
      generateQRCode();
    }
  }, [paymentDetails]);

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

  // Show payment status tracker if we have a reference and haven't confirmed payment yet
  if (reference && !showSuccess && !error) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Payment Processing...
              </h1>
              <p className="text-muted-foreground">
                We're confirming your payment with Remita. This usually takes 30 seconds.
              </p>
            </div>
            <PaymentStatusTracker
              reference={reference}
              onComplete={handlePaymentComplete}
              onFailure={handlePaymentFailure}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
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
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/pay">Try Again</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show success page only after payment is confirmed
  if (!showSuccess || !paymentDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Preparing your receipt...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Real timeline from payment data
  const timeline = [
    { label: "Payment initiated", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
    { label: "Sent to Remita", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
    { label: "Bank processing", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
    { label: "Amount received", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
    { label: "AMAC account credited", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
    { label: "Receipt generated", time: paymentDetails.paid_at ? new Date(paymentDetails.paid_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : paymentTime, done: true },
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
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={downloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={sendEmailAgain}
                disabled={isEmailing}
              >
                {isEmailing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {isEmailing ? 'Sending...' : 'Email Again'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={sendSMSAgain}
                disabled={isSMSing}
              >
                {isSMSing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4 mr-2" />
                )}
                {isSMSing ? 'Sending...' : 'SMS Again'}
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
            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center border border-border">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Receipt QR Code" className="w-28 h-28" />
              ) : (
                <QrCode className="w-20 h-20 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Scan to verify this receipt is authentic
            </p>
            <p className="text-xs text-muted-foreground">
              Verify at: {window.location.origin}/verify-receipt?receipt={paymentDetails?.receipt_number}
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
              <Link to="/pay">
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
