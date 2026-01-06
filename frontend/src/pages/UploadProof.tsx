import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const UploadProof = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch payment details
  useState(() => {
    const fetchPayment = async () => {
      if (!paymentId) return;

      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (error) throw error;
        setPayment(data);
      } catch (error) {
        console.error('Error fetching payment:', error);
        toast.error('Payment not found');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !payment) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `proof-${payment.id}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update payment record with proof URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          proof_of_payment_url: publicUrl,
          status: 'awaiting_verification',
          submitted_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      setSubmitted(true);
      toast.success('Proof uploaded successfully! We will verify your payment within 1-2 hours.');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Payment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The payment you're looking for doesn't exist or has expired.
            </p>
            <Button asChild>
              <Link to="/services">Return to Services</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />

        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Proof Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment proof has been uploaded successfully. We will verify your transfer and confirm payment within 1-2 hours.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-2">Payment Details:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono">{payment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{formatAmount(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{payment.service_name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link to="/services">Make Another Payment</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Return to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
            to={`/pay/${payment.revenue_type}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Upload Payment Proof
            </h1>
            <p className="text-muted-foreground">
              Please upload a screenshot or photo of your bank transfer receipt
            </p>
          </motion.div>

          {/* Payment Summary */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium">{payment.service_name}</h3>
                  <p className="text-sm text-muted-foreground">Reference: {payment.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{formatAmount(payment.amount)}</p>
                  <p className="text-sm text-muted-foreground">Bank Transfer</p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Make sure your transfer shows the exact amount ({formatAmount(payment.amount)})
                  to Zenith Bank account 1310770007 (Abuja Municipal Area Council).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Proof of Payment
              </CardTitle>
              <CardDescription>
                Upload a clear image of your transfer receipt or bank statement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-4">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full max-h-48 mx-auto rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-lg font-medium">{selectedFile.name}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Click to change file • Max 5MB • JPEG, PNG, or PDF
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Click to upload proof</p>
                      <p className="text-sm text-muted-foreground">
                        JPEG, PNG, or PDF • Max 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Proof
                  </>
                )}
              </Button>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <h4 className="font-medium mb-2">📋 Upload Instructions:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Take a clear photo of your transfer receipt</li>
                  <li>• Include sender account details and transaction reference</li>
                  <li>• Ensure the recipient shows "Abuja Municipal Area Council"</li>
                  <li>• Files are securely stored and only used for verification</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-medium text-blue-800 mb-1">⏱️ Processing Time</h4>
                <p className="text-blue-700">
                  Bank transfers are verified within 1-2 hours during business hours (8AM-5PM, Monday-Friday).
                  You'll receive confirmation via email and SMS once verified.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadProof;
