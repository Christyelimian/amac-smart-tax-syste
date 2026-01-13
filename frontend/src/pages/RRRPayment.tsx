import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, QrCode, Smartphone, CreditCard, Building2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentDetails {
  reference: string;
  rrr: string;
  amount: number;
  service_name: string;
  payer_name: string;
  status: string;
}

const RRRPayment = () => {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) {
      navigate('/pay');
      return;
    }

    loadPaymentDetails();
  }, [reference, navigate]);

  const loadPaymentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reference', reference)
        .single();

      if (error) throw error;

      setPaymentDetails(data);
    } catch (error) {
      console.error('Error loading payment details:', error);
      toast.error('Failed to load payment details');
      navigate('/pay');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The payment you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/pay">Browse Services</Link>
            </Button>
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
          {/* Back Button */}
          <Link
            to="/pay"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Portal
          </Link>

          {/* Payment Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border overflow-hidden mb-6"
          >
            <div className="bg-primary/10 p-6 text-center border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
              <p className="text-3xl md:text-4xl font-bold text-foreground">
                {formatAmount(paymentDetails.amount)}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* RRR Display */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Remita RRR</label>
                  <button
                    onClick={() => handleCopy(paymentDetails.rrr)}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="font-mono text-lg font-bold text-primary tracking-wider">
                  {paymentDetails.rrr}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this RRR to pay via any Remita channel
                </p>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium text-foreground text-xs font-mono">{paymentDetails.reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium text-foreground">{paymentDetails.service_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payer</p>
                  <p className="font-medium text-foreground">{paymentDetails.payer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground capitalize">{paymentDetails.status}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-foreground">How to Pay</h3>

            {/* Online Payment */}
            <div className="border-2 border-primary rounded-xl p-5 bg-primary/5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Pay Online Now</h4>
                  <p className="text-sm text-muted-foreground">
                    Click below to pay with card, USSD, or bank transfer
                  </p>
                </div>
              </div>
              <Button 
                className="w-full rounded-xl bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = `https://remita.net/remita/ecomm/finalize.reg?rrr=${paymentDetails.rrr}&merchantId=2547916`}
              >
                Pay Online with Remita →
              </Button>
            </div>

            {/* Bank Payment */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Bank Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    Pay at any bank using the RRR above
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <p>1. Visit any bank branch</p>
                <p>2. Provide the RRR: <span className="font-mono font-bold">{paymentDetails.rrr}</span></p>
                <p>3. Pay the amount: {formatAmount(paymentDetails.amount)}</p>
                <p>4. Get your receipt instantly</p>
              </div>
            </div>

            {/* USSD Payment */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">USSD Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    Dial USSD code to pay from your mobile
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="font-mono text-lg font-bold text-foreground mb-2">
                  *322*270007777777#
                </p>
                <p className="text-xs text-muted-foreground">
                  Follow prompts and enter RRR when requested
                </p>
              </div>
            </div>

            {/* Remita App */}
            <div className="border border-border rounded-xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Remita Mobile App</h4>
                  <p className="text-sm text-muted-foreground">
                    Download Remita app and pay with RRR
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Download App
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Scan QR Code
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Important Notes:</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Keep your RRR safe - it's your payment reference</li>
                  <li>• Payment confirmation may take 1-5 minutes</li>
                  <li>• You'll receive an SMS/email receipt after payment</li>
                  <li>• For issues, contact support with your reference: {paymentDetails.reference}</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl"
              onClick={() => navigate('/payment-success?ref=' + paymentDetails.reference + '&rrr=' + paymentDetails.rrr + '&gateway=remita')}
            >
              Check Payment Status
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl"
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RRRPayment;