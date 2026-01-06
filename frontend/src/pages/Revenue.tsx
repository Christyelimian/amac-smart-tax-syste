import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ArrowRight, Filter, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const Revenue = () => {
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to App</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-3">
              <img
                src="/amac-logo.png"
                alt="AMAC Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-gray-800">AMAC Revenue Services</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-[#006838] py-8 md:py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                AMAC Revenue Services
              </h1>
              <p className="text-lg text-green-100 mb-6">
                Browse all {revenueTypes.length} payment services available through AMAC
              </p>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 md:h-14 pl-12 pr-12 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/70 shadow-lg focus:border-white/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-6 md:py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar - Desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
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
                              ? "bg-[#006838] text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              selectedCategory === category.id
                                ? "bg-white/20"
                                : "bg-gray-200"
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
                  className="w-full justify-center border-gray-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter by Category
                  {selectedCategory !== "all" && (
                    <span className="ml-2 px-2 py-0.5 bg-[#006838] text-white text-xs rounded-full">
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
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                    onClick={() => setShowMobileFilters(false)}
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "-100%" }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white p-6"
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
                                  ? "bg-[#006838] text-white"
                                  : "hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span className="text-xl">{category.icon}</span>
                                <span className="font-medium">{category.name}</span>
                              </span>
                              <span
                                className={`text-sm px-2 py-0.5 rounded-full ${
                                  selectedCategory === category.id
                                    ? "bg-white/20"
                                    : "bg-gray-200"
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
                  <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <p className="text-4xl mb-4">🔍</p>
                    <p className="text-lg font-medium text-gray-800 mb-2">No services found</p>
                    <p className="text-gray-600">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                ) : selectedCategory === "all" ? (
                  // Grouped view
                  <div className="space-y-8">
                    {Object.entries(groupedServices).map(([categoryId, services]) => {
                      const categoryInfo = getCategoryInfo(categoryId);
                      return (
                        <motion.div
                          key={categoryId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span>{categoryInfo.icon}</span>
                            {categoryInfo.name}
                            <span className="text-sm font-normal text-gray-600">
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
                    <p className="text-gray-600 mb-4">
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
      className="group flex items-center justify-between p-4 md:p-5 bg-white rounded-xl border border-gray-200 hover:border-[#006838]/30 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{service.icon}</span>
        <div>
          <h3 className="font-medium text-gray-800 group-hover:text-[#006838] transition-colors">
            {service.name}
          </h3>
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {service.baseAmount && (
          <span className="hidden sm:block text-sm font-medium text-gray-800">
            {formatAmount(service.baseAmount)}
          </span>
        )}
        <Button size="sm" className="rounded-lg bg-[#006838] hover:bg-[#004d2a] transition-colors">
          Pay <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Link>
  );
};

export default Revenue;
