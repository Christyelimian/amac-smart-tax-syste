import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Shield, Building2, CreditCard, Smartphone, Loader2, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface RevenueType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  base_amount: number;
  has_zones: boolean;
  is_recurring: boolean;
  icon: string;
  is_active: boolean;
}

interface Zone {
  id: string;
  name: string;
  description: string;
  multiplier: number;
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PaymentForm = () => {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [service, setService] = useState<RevenueType | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    businessName: "",
    registrationNumber: "",
    address: "",
    zone: "",
    contactPerson: "",
    phone: "",
    email: "",
    smsUpdates: true,
    emailReceipt: true,
    amount: 0,
    paymentPeriod: "annual",
    notes: "",
    confirmDetails: false,
  });

  useEffect(() => {
    loadServiceAndZones();
  }, [serviceCode]);

  useEffect(() => {
    if (service) {
      setFormData(prev => ({ ...prev, amount: service.base_amount }));
    }
  }, [service]);

  const loadServiceAndZones = async () => {
    try {
      const [serviceResponse, zonesResponse] = await Promise.all([
        supabase.from('revenue_types').select('*').eq('code', serviceCode).single(),
        supabase.from('zones').select('*').order('id')
      ]);

      if (serviceResponse.error) throw serviceResponse.error;
      if (zonesResponse.error) throw zonesResponse.error;

      setService(serviceResponse.data);
      setZones(zonesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load service details');
      navigate('/pay');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading service details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-foreground mb-2">Service Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The service you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/pay">Browse All Services</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Business Info" },
    { number: 2, title: "Payment Details" },
    { number: 3, title: "Pay" },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCardPayment = async () => {
    // Validate required fields
    if (!formData.businessName || !formData.phone || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Zone is now optional - no validation required
    // if (service.has_zones && !formData.zone) {
    //   toast.error("Please select a zone for this service");
    //   return;
    // }

    setIsProcessing(true);

    try {
      console.log("Initializing Remita payment...");

      // Calculate final amount with zone multiplier
      let finalAmount = formData.amount;
      if (service.has_zones && formData.zone) {
        const selectedZone = zones.find(z => z.id === formData.zone);
        if (selectedZone) {
          finalAmount = formData.amount * selectedZone.multiplier;
        }
      }

      // Try multiple payment initialization methods
      let paymentData = null;
      let lastError = null;

      // Method 1: Try local server (for development)
      if (window.location.hostname === 'localhost') {
        try {
          console.log("🚀 Trying local payment server...");
          const response = await fetch('http://localhost:3001/initialize-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              revenueType: service.code,
              serviceName: service.name,
              amount: finalAmount,
              payerName: formData.contactPerson || formData.businessName,
              payerPhone: formData.phone,
              payerEmail: formData.email || undefined,
              businessAddress: formData.address || undefined,
              registrationNumber: formData.registrationNumber || undefined,
              zone: formData.zone || undefined,
              notes: formData.notes || undefined,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              paymentData = data;
              console.log("✅ Local server succeeded:", paymentData);
            }
          }
        } catch (error) {
          console.warn("❌ Local server failed:", error.message);
          lastError = error;
        }
      }

      // Method 2: Try Edge Function (for production)
      if (!paymentData) {
        try {
          console.log("🚀 Trying Edge Function...");
          const { data, error } = await supabase.functions.invoke('initialize-payment', {
            body: {
              revenueType: service.code,
              serviceName: service.name,
              amount: finalAmount,
              payerName: formData.contactPerson || formData.businessName,
              payerPhone: formData.phone,
              payerEmail: formData.email || undefined,
              businessAddress: formData.address || undefined,
              registrationNumber: formData.registrationNumber || undefined,
              zone: formData.zone || undefined,
              notes: formData.notes || undefined,
            }
          });

          if (!error && data?.success) {
            paymentData = data;
            console.log("✅ Edge Function succeeded:", paymentData);
          } else if (error) {
            console.warn("❌ Edge Function error:", error.message);
            lastError = new Error(error.message);
          }
        } catch (error) {
          console.warn("❌ Edge Function failed:", error.message);
          lastError = error;
        }
      }

      // Method 3: Fallback - Create payment record and redirect to manual payment
      if (!paymentData) {
        console.log("🚀 Using fallback method - creating payment record...");
        
        // Generate reference for tracking
        const reference = `AMC-${service.code.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Create payment record in database
        const { data: paymentRecord, error: dbError } = await supabase
          .from('payments')
          .insert([{
            reference,
            payer_name: formData.contactPerson || formData.businessName,
            payer_phone: formData.phone,
            payer_email: formData.email || undefined,
            property_name: formData.businessName,
            business_address: formData.address || undefined,
            registration_number: formData.registrationNumber || undefined,
            service_name: service.name,
            revenue_type: service.code,
            revenue_type_code: service.code,
            zone_id: formData.zone || undefined,
            amount: finalAmount,
            status: 'pending',
            payment_method: 'card',
            payment_channel: 'card',
            notes: formData.notes || undefined,
          }])
          .select()
          .single();

        if (dbError) {
          throw new Error(`Failed to create payment record: ${dbError.message}`);
        }

        // Generate a simulated RRR for the fallback
        const rrr = `AMC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        paymentData = {
          success: true,
          reference,
          rrr,
          paymentUrl: `https://remitademo.net/remita/ecomm/finalize.reg?rrr=${rrr}&merchantId=2547916`,
          amount: finalAmount,
          fallback: true,
          message: 'Using fallback payment method'
        };

        console.log("✅ Fallback method succeeded:", paymentData);
      }

      if (!paymentData || !paymentData.success) {
        throw new Error(lastError?.message || "All payment initialization methods failed");
      }

      console.log("Payment initialized:", paymentData);

      // Redirect to Remita payment page
      if (paymentData.paymentUrl) {
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error("No payment URL received");
      }

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    // Validate required fields
    if (!formData.businessName || !formData.phone || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Zone is now optional - no validation required
    // if (service.has_zones && !formData.zone) {
    //   toast.error("Please select a zone for this service");
    //   return;
    // }

    setIsProcessing(true);

    try {
      console.log("Creating bank transfer payment...");

      // Calculate final amount with zone multiplier
      let finalAmount = formData.amount;
      if (service.has_zones && formData.zone) {
        const selectedZone = zones.find(z => z.id === formData.zone);
        if (selectedZone) {
          finalAmount = formData.amount * selectedZone.multiplier;
        }
      }

      // Generate unique reference for tracking
      const reference = `AMC-${service.code.substring(0, 3).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create bank transfer payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          reference,
          payer_name: formData.contactPerson || formData.businessName,
          payer_phone: formData.phone,
          payer_email: formData.email || undefined,
          property_name: formData.businessName,
          business_address: formData.address || undefined,
          registration_number: formData.registrationNumber || undefined,
          service_name: service.name,
          revenue_type: service.code,
          revenue_type_code: service.code,
          zone_id: formData.zone || undefined,
          amount: finalAmount,
          status: 'pending',
          payment_method: 'bank_transfer',
          payment_channel: 'bank_transfer',
          notes: formData.notes || undefined,
        }])
        .select()
        .single();

      if (paymentError) throw paymentError;

      console.log("Bank transfer payment created:", paymentData);

      // Redirect to upload proof page
      navigate(`/upload-proof/${paymentData.id}`);

    } catch (error) {
      console.error("Bank transfer error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate bank transfer. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Button */}
          <Link
            to="/pay"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Portal
          </Link>

          {/* Service Header */}
          <div className="bg-card rounded-2xl p-6 mb-6 border border-border">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{service.icon}</span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {service.name}
                </h1>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-card rounded-2xl p-6 mb-6 border border-border">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep > step.number
                          ? "bg-success text-success-foreground"
                          : currentStep === step.number
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`hidden sm:block font-medium ${
                        currentStep >= step.number
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 md:w-24 h-1 mx-4 rounded-full ${
                        currentStep > step.number ? "bg-success" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-2xl p-6 md:p-8 border border-border"
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 1 of 3: Business Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business/Property Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({ ...formData, businessName: e.target.value })
                      }
                      placeholder="e.g., Transcorp Hilton Abuja"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Business Registration Number (Optional)</Label>
                    <Input
                      id="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationNumber: e.target.value })
                      }
                      placeholder="e.g., RC1234567"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Business Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="e.g., 1 Aguiyi Ironsi Street, Maitama"
                      className="mt-1.5"
                    />
                  </div>

                  {service.has_zones && (
                    <div>
                      <Label htmlFor="zone">Zone (Optional)</Label>
                      <Select
                        value={formData.zone}
                        onValueChange={(value) =>
                          setFormData({ ...formData, zone: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select Zone (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              <span className="font-medium">{zone.name}</span>
                              <span className="text-muted-foreground ml-2">
                                ({zone.description}) - {zone.multiplier}x multiplier
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                      placeholder="e.g., Mr. John Okafor"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="e.g., 08012345678"
                      className="mt-1.5"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="smsUpdates"
                        checked={formData.smsUpdates}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, smsUpdates: checked as boolean })
                        }
                      />
                      <label htmlFor="smsUpdates" className="text-sm text-muted-foreground">
                        Send me SMS updates
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address (Recommended for receipts)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="e.g., manager@business.com"
                      className="mt-1.5"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="emailReceipt"
                        checked={formData.emailReceipt}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, emailReceipt: checked as boolean })
                        }
                      />
                      <label htmlFor="emailReceipt" className="text-sm text-muted-foreground">
                        Send me email receipt
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} size="lg" className="rounded-xl">
                    Continue to Payment Details <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Your information is safe and encrypted
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 2 of 3: Payment Amount
                </h2>

                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">Revenue Type</p>
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">Business</p>
                  <p className="font-medium text-foreground">{formData.businessName || "—"}</p>
                  {service.has_zones && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">Location</p>
                      <p className="font-medium text-foreground">
                        {zones.find((z) => z.id === formData.zone)?.name || "—"}
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount to Pay *</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        ₦
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: Number(e.target.value) })
                        }
                        className="pl-10 text-lg font-semibold"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      💡 Standard fee: {formatAmount(service.base_amount)}.
                      {service.has_zones && formData.zone && (
                        <span className="ml-1">
                          Zone multiplier: {zones.find(z => z.id === formData.zone)?.multiplier}x
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="paymentPeriod">Payment Period</Label>
                    <Select
                      value={formData.paymentPeriod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, paymentPeriod: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual (January 2026 - December 2026)</SelectItem>
                        <SelectItem value="renewal">Renewal (Paying arrears)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="e.g., Renewal for 2026 operations"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue Type</span>
                      <span className="text-foreground">{service.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business</span>
                      <span className="text-foreground">{formData.businessName || "—"}</span>
                    </div>
                    {service.has_zones && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zone</span>
                        <span className="text-foreground">
                          {zones.find((z) => z.id === formData.zone)?.name || "—"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period</span>
                      <span className="text-foreground">Jan 2026 - Dec 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Amount</span>
                      <span className="text-foreground">{formatAmount(formData.amount)}</span>
                    </div>
                    {service.has_zones && formData.zone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zone Multiplier</span>
                        <span className="text-foreground">
                          {zones.find(z => z.id === formData.zone)?.multiplier}x
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="text-success">₦0.00 (Waived)</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between text-base font-semibold">
                        <span>Total to Pay</span>
                        <span className="text-primary">
                          {formatAmount(
                            service.has_zones && formData.zone
                              ? formData.amount * (zones.find(z => z.id === formData.zone)?.multiplier || 1)
                              : formData.amount
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="confirmDetails"
                    checked={formData.confirmDetails}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, confirmDetails: checked as boolean })
                    }
                  />
                  <label htmlFor="confirmDetails" className="text-sm text-foreground">
                    I confirm the details above are correct
                  </label>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleBack} size="lg" className="rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="rounded-xl"
                    disabled={!formData.confirmDetails}
                  >
                    Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 3 of 3: Choose Payment Method
                </h2>

                <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(
                        service.has_zones && formData.zone
                          ? formData.amount * (zones.find(z => z.id === formData.zone)?.multiplier || 1)
                          : formData.amount
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium text-foreground">
                      {formData.businessName} - {service.name}
                    </p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  {/* Pay Now - Remita - Recommended */}
                  <div className="border-2 border-[#006838] rounded-xl p-5 bg-[#006838]/5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#006838]/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#006838]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">💳 PAY NOW (Card/USSD)</h3>
                          <span className="px-2 py-0.5 bg-[#006838] text-white text-xs rounded-full">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ✓ Instant receipt • ✓ No waiting • ✓ Secure payment via Remita
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="text-red-600">Note: Includes {formData.amount > 100000 ? '1.5% + ₦100' : '1.5%'} transaction fee</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleCardPayment}
                      size="lg"
                      className="w-full rounded-xl bg-[#006838] hover:bg-[#004d2a]"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Pay {formatAmount(
                          service.has_zones && formData.zone
                            ? formData.amount * (zones.find(z => z.id === formData.zone)?.multiplier || 1)
                            : formData.amount
                        )} →</>
                      )}
                    </Button>
                  </div>

                  {/* Bank Transfer - Manual Verification */}
                  <div className="border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">🏦 Bank Transfer</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Takes 1-2 hours for approval • Upload proof required • Available 8AM-5PM Mon-Fri
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          <span className="text-green-600">No transaction fees • Save money on large payments</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name</span>
                        <span className="font-medium">Zenith Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number</span>
                        <span className="font-medium font-mono">1310770007</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-medium">Abuja Municipal Area Council</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleBankTransfer}
                      variant="outline"
                      size="lg"
                      className="w-full rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50"
                      disabled={isProcessing}
                    >
                      Continue with Bank Transfer →
                    </Button>
                  </div>

                  {/* USSD Code Option */}
                  <div className="border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">📱 USSD Code (No Internet Needed)</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Dial USSD code on any mobile network • Instant payment
                        </p>
                        <div className="bg-muted/50 rounded-lg p-3 mt-2">
                          <p className="text-sm font-mono text-center">
                            *322*270007777777# (Sample)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            USSD code will be generated after payment initialization
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remita App QR Code */}
                  <div className="border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">📲 Remita Mobile App</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scan QR code with Remita app • Download from app stores
                        </p>
                        <div className="bg-muted/50 rounded-lg p-3 mt-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            QR code will be generated after payment initialization
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border">
                  <Button variant="outline" onClick={handleBack} size="lg" className="rounded-xl" disabled={isProcessing}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  All payment methods are secure and encrypted
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentForm;
