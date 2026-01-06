import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowRight, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { revenueTypes, categories } from "@/data/revenueTypes";

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Services = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredServices = useMemo(() => {
    return revenueTypes.filter((service) => {
      const matchesSearch =
        searchQuery === "" ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || service.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, typeof revenueTypes> = {};
    
    filteredServices.forEach((service) => {
      if (!groups[service.category]) {
        groups[service.category] = [];
      }
      groups[service.category].push(service);
    });

    return groups;
  }, [filteredServices]);

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId) || { name: categoryId, icon: "📋" };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-primary py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                All Revenue Types
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Browse all {revenueTypes.length} payment services available through AMAC Pay
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 md:h-14 pl-12 pr-12 rounded-xl border-0 shadow-lg text-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar - Desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24 bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                  <nav className="space-y-1">
                    {categories.map((category) => {
                      const count =
                        category.id === "all"
                          ? revenueTypes.length
                          : revenueTypes.filter((r) => r.category === category.id).length;

                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedCategory === category.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              selectedCategory === category.id
                                ? "bg-primary-foreground/20"
                                : "bg-muted"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </aside>

              {/* Mobile Filter Button */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  onClick={() => setShowMobileFilters(true)}
                  className="w-full justify-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter by Category
                  {selectedCategory !== "all" && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      1
                    </span>
                  )}
                </Button>
              </div>

              {/* Mobile Filter Sheet */}
              <AnimatePresence>
                {showMobileFilters && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "-100%" }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card p-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg">Categories</h3>
                        <button onClick={() => setShowMobileFilters(false)}>
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <nav className="space-y-1">
                        {categories.map((category) => {
                          const count =
                            category.id === "all"
                              ? revenueTypes.length
                              : revenueTypes.filter((r) => r.category === category.id).length;

                          return (
                            <button
                              key={category.id}
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setShowMobileFilters(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                                selectedCategory === category.id
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className="text-xl">{category.icon}</span>
                                <span className="font-medium">{category.name}</span>
                              </span>
                              <span
                                className={`text-sm px-2 py-0.5 rounded-full ${
                                  selectedCategory === category.id
                                    ? "bg-primary-foreground/20"
                                    : "bg-muted"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Services List */}
              <div className="flex-1">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-lg font-medium text-foreground mb-2">No services found</p>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                ) : selectedCategory === "all" ? (
                  // Grouped view
                  <div className="space-y-10">
                    {Object.entries(groupedServices).map(([categoryId, services]) => {
                      const categoryInfo = getCategoryInfo(categoryId);
                      return (
                        <motion.div
                          key={categoryId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span>{categoryInfo.icon}</span>
                            {categoryInfo.name}
                            <span className="text-sm font-normal text-muted-foreground">
                              ({services.length})
                            </span>
                          </h2>
                          <div className="space-y-3">
                            {services.map((service) => (
                              <ServiceCard key={service.id} service={service} />
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  // Flat view for filtered
                  <div className="space-y-3">
                    <p className="text-muted-foreground mb-4">
                      Showing {filteredServices.length} results
                    </p>
                    {filteredServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

interface ServiceCardProps {
  service: (typeof revenueTypes)[0];
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <Link
      to={`/pay/${service.id}`}
      className="group flex items-center justify-between p-4 md:p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{service.icon}</span>
        <div>
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {service.baseAmount && (
          <span className="hidden sm:block text-sm font-medium text-foreground">
            {formatAmount(service.baseAmount)}
          </span>
        )}
        <Button size="sm" className="rounded-lg group-hover:bg-primary transition-colors">
          Pay <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Link>
  );
};

export default Services;
