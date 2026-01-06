import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Building2, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

const PaymentPortal = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [revenueTypes, setRevenueTypes] = useState<RevenueType[]>([]);
  const [filteredServices, setFilteredServices] = useState<RevenueType[]>([]);
  const [popularServices, setPopularServices] = useState<RevenueType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRevenueTypes();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, revenueTypes]);

  const loadRevenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setRevenueTypes(data || []);

      // Popular services for quick access
      const popularCodes = [
        'property-tax', 'business-premises', 'hotel-license', 'restaurant-license',
        'market-stall', 'taxi-permit', 'tricycle-permit', 'motorcycle-permit'
      ];

      const popular = data?.filter(service => popularCodes.includes(service.code)) || [];
      setPopularServices(popular);

    } catch (error) {
      console.error('Error loading revenue types:', error);
      toast.error('Failed to load services. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterServices = () => {
    if (!searchQuery.trim()) {
      setFilteredServices(revenueTypes.slice(0, 12));
      return;
    }

    const filtered = revenueTypes.filter(service =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredServices(filtered.slice(0, 12));
  };

  const handleServiceSelect = (service: RevenueType) => {
    navigate(`/pay/${service.code}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredServices.length === 1) {
      handleServiceSelect(filteredServices[0]);
    } else if (filteredServices.length > 1) {
      toast.info(`Found ${filteredServices.length} services. Select one to continue.`);
    } else {
      toast.error('No services found matching your search.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Building2 className="w-12 h-12 text-primary" />
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                      Abuja Municipal Area Council
                    </h1>
                    <p className="text-primary font-semibold">Revenue Payment Portal</p>
                  </div>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                  💰 What are you paying for?
                </h2>
              </motion.div>

              {/* Search Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border mb-8"
              >
                <form onSubmit={handleSearchSubmit} className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="🔍 Search for revenue type (e.g., 'hotel license', 'motorcycle permit', 'property tax')"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-4 text-lg rounded-xl"
                    />
                  </div>
                </form>

                {/* Search Results */}
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                  >
                    <h3 className="text-lg font-semibold mb-4">
                      {filteredServices.length > 0
                        ? `Found ${filteredServices.length} service${filteredServices.length === 1 ? '' : 's'}`
                        : 'No services found'
                      }
                    </h3>

                    {filteredServices.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map((service) => (
                          <Card
                            key={service.code}
                            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                            onClick={() => handleServiceSelect(service)}
                          >
                            <div className="p-4">
                              <div className="text-2xl mb-2">{service.icon}</div>
                              <h4 className="font-semibold text-sm">{service.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {service.category}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-sm font-medium text-primary">
                                  {formatCurrency(service.base_amount)}
                                </span>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Popular Services */}
                {!searchQuery && (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {popularServices.map((service) => (
                        <Card
                          key={service.code}
                          className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="p-4 text-center">
                            <div className="text-3xl mb-2">{service.icon}</div>
                            <h4 className="font-semibold text-sm">{service.name}</h4>
                            <div className="flex items-center justify-center gap-2 mt-3">
                              <span className="text-xs font-medium text-primary">
                                {formatCurrency(service.base_amount)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* View All Link */}
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/services')}
                    className="rounded-xl"
                  >
                    View All 51 Revenue Types →
                  </Button>
                </div>
              </motion.div>

              {/* Trust Signals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Secured by Remita
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    Official AMAC Platform
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    24/7 Available
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  All transactions are secured with bank-level encryption
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPortal;
