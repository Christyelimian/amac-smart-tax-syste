import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Shield, Building2, CreditCard, Smartphone, Loader2, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { revenueTypes } from "@/data/revenueTypes";
import { supabase } from "@/integrations/supabase/client";

const zones = [
  { id: "a", name: "Zone A", description: "Maitama, Asokoro, Wuse, Central Area" },
  { id: "b", name: "Zone B", description: "Garki, Gwarinpa, Kubwa, Jabi" },
  { id: "c", name: "Zone C", description: "Nyanya, Karu, Lugbe, Gwagwalada" },
  { id: "d", name: "Zone D", description: "Other areas" },
];

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const PaymentForm = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'remita'>('paystack');
  
  const service = revenueTypes.find((r) => r.id === serviceId);

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
    amount: service?.baseAmount || 0,
    paymentPeriod: "annual",
    notes: "",
    confirmDetails: false,
  });

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
              <Link to="/services">Browse All Services</Link>
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

  const handlePaystackPayment = async () => {
    // Validate required fields
    if (!formData.businessName || !formData.phone || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("Initializing Paystack payment...");
      
      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: {
          revenueType: serviceId,
          serviceName: service.name,
          amount: formData.amount,
          payerName: formData.contactPerson || formData.businessName,
          payerPhone: formData.phone,
          payerEmail: formData.email || undefined,
          businessAddress: formData.address || undefined,
          registrationNumber: formData.registrationNumber || undefined,
          zone: formData.zone || undefined,
          notes: formData.notes || undefined,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to initialize payment");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Payment initialization failed");
      }

      console.log("Payment initialized:", data);

      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL received");
      }

    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleRemitaPayment = async () => {
    // Validate required fields
    if (!formData.businessName || !formData.phone || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("Initializing Remita payment...");
      
      const { data, error } = await supabase.functions.invoke('initialize-remita', {
        body: {
          revenueType: serviceId,
          serviceName: service.name,
          amount: formData.amount,
          payerName: formData.contactPerson || formData.businessName,
          payerPhone: formData.phone,
          payerEmail: formData.email || undefined,
          businessAddress: formData.address || undefined,
          registrationNumber: formData.registrationNumber || undefined,
          zone: formData.zone || undefined,
          notes: formData.notes || undefined,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to initialize Remita payment");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Remita payment initialization failed");
      }

      console.log("Remita RRR generated:", data);

      // Load Remita inline payment script and process payment
      const existingScript = document.querySelector('script[src*="remita-pay-inline"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://demo.remita.net/payment/v1/remita-pay-inline.bundle.js';
      script.onload = () => {
        try {
          // @ts-ignore - Remita global object
          const RmPaymentEngine = window.RmPaymentEngine;
          if (!RmPaymentEngine) {
            throw new Error('Remita payment engine not loaded');
          }

          const paymentEngine = RmPaymentEngine.init({
            key: data.publicKey,
            processRrr: true,
            transactionId: String(data.rrr),
            extendedData: {
              customFields: [
                { name: 'rrr', value: String(data.rrr) },
                { name: 'payerName', value: data.payerName },
                { name: 'payerEmail', value: data.payerEmail },
                { name: 'payerPhone', value: data.payerPhone },
              ],
            },
            onSuccess: (response: any) => {
              console.log('Remita payment successful:', response);
              navigate(`/payment-success?ref=${data.reference}&rrr=${data.rrr}&gateway=remita`);
            },
            onError: (response: any) => {
              console.error('Remita payment error:', response);
              toast.error("Payment failed. Please try again.");
              setIsProcessing(false);
            },
            onClose: () => {
              console.log('Remita payment modal closed');
              setIsProcessing(false);
            },
          });
          paymentEngine.showPaymentWidget();
        } catch (scriptError) {
          console.error('Error initializing Remita widget:', scriptError);
          toast.error("Failed to initialize payment. Please try again.");
          setIsProcessing(false);
        }
      };
      script.onerror = () => {
        toast.error("Failed to load payment gateway. Please try again.");
        setIsProcessing(false);
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error("Remita payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process Remita payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (selectedGateway === 'remita') {
      handleRemitaPayment();
    } else {
      handlePaystackPayment();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Button */}
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Services
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

                  <div>
                    <Label htmlFor="zone">Zone *</Label>
                    <Select
                      value={formData.zone}
                      onValueChange={(value) =>
                        setFormData({ ...formData, zone: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            <span className="font-medium">{zone.name}</span>
                            <span className="text-muted-foreground ml-2">
                              ({zone.description})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                  <p className="text-sm text-muted-foreground mt-2">Location</p>
                  <p className="font-medium text-foreground">
                    {zones.find((z) => z.id === formData.zone)?.name || "—"}
                  </p>
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
                      💡 Standard fee for this service. Enter a different amount if applicable.
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zone</span>
                      <span className="text-foreground">
                        {zones.find((z) => z.id === formData.zone)?.name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period</span>
                      <span className="text-foreground">Jan 2026 - Dec 2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-foreground">{formatAmount(formData.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="text-success">₦0.00 (Waived)</span>
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between text-base font-semibold">
                        <span>Total to Pay</span>
                        <span className="text-primary">{formatAmount(formData.amount)}</span>
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
                  Step 3 of 3: Choose Payment Gateway
                </h2>

                <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(formData.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium text-foreground">
                      {formData.businessName} - {service.name}
                    </p>
                  </div>
                </div>

                {/* Gateway Selection */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">Select Payment Gateway:</p>
                  
                  {/* Paystack Option */}
                  <div 
                    className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      selectedGateway === 'paystack' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedGateway('paystack')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedGateway === 'paystack' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${
                          selectedGateway === 'paystack' ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">Paystack</h3>
                          <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                            Popular
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ✓ Card, Bank Transfer, USSD • ✓ Instant confirmation
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGateway === 'paystack' ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedGateway === 'paystack' && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* Remita Option */}
                  <div 
                    className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                      selectedGateway === 'remita' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedGateway('remita')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedGateway === 'remita' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Banknote className={`w-6 h-6 ${
                          selectedGateway === 'remita' ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">Remita</h3>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs rounded-full">
                            Government
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          ✓ RRR Generation • ✓ Official government payment
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGateway === 'remita' ? 'border-primary bg-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedGateway === 'remita' && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  size="lg"
                  className="w-full rounded-xl"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedGateway === 'paystack' ? '💳' : '🏦'} Pay {formatAmount(formData.amount)} with {selectedGateway === 'paystack' ? 'Paystack' : 'Remita'}
                    </>
                  )}
                </Button>

                {/* Alternative Payment Methods */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Other payment options:</p>
                  
                  {/* Bank Transfer Info */}
                  <div className="border border-border rounded-xl p-5 mb-3">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Bank Transfer</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Transfer {formatAmount(formData.amount)} to:
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name</span>
                        <span className="font-medium">Zenith Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number</span>
                        <span className="font-medium font-mono">1225891457</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name</span>
                        <span className="font-medium">AMAC Revenue Account</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      ⏱️ Confirmation in 1-5 minutes after transfer
                    </p>
                  </div>

                  {/* USSD */}
                  <div className="border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">USSD Payment</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Dial this code on your phone (no internet needed)
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <p className="font-mono text-lg font-bold text-foreground">
                        *322*270008123456#
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Works on all networks (MTN, Airtel, Glo, 9mobile)
                    </p>
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
