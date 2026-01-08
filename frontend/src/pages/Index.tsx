import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Gavel,
  Banknote,
  Phone,
  Mail,
  Info,
  HelpCircle,
  Menu,
  ChevronRight,
  FileText,
  PlusCircle,
  Search,
  ShieldCheck,
  Building,
  Store,
  Car,
  Wrench,
  Filter
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface RevenueType {
  code: string;
  name: string;
  category: string;
  description?: string;
  base_amount?: number;
  has_zones: boolean;
  is_recurring: boolean;
  icon: string;
  is_active: boolean;
}

const Index = () => {
  const [showAssessmentOptions, setShowAssessmentOptions] = useState(false);
  const [revenueTypes, setRevenueTypes] = useState<RevenueType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<RevenueType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const menuItems = [
    {
      title: "AMAC REVENUE APP",
      path: "https://www.jotform.com/app/230894663123559",
      icon: DollarSign,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "AMAC REVENUE",
      path: "/revenue",
      icon: DollarSign,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "AMAC AUCTION",
      path: "/auction",
      icon: Gavel,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "AMAC MICROFINANCE",
      path: "/microfinance",
      icon: Banknote,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "EMERGENCY LINES",
      path: "/emergency",
      icon: Phone,
      color: "bg-[#4a2c2a] hover:bg-[#2d1a19]",
      textColor: "text-white"
    },
    {
      title: "CONTACT US",
      path: "/contact",
      icon: Mail,
      color: "bg-[#0284c7] hover:bg-[#0369a1]",
      textColor: "text-white"
    },
    {
      title: "ABOUT US",
      path: "/about",
      icon: Info,
      color: "bg-[#1f2937] hover:bg-[#111827]",
      textColor: "text-white"
    },
    {
      title: "SUPPORTS",
      path: "/support",
      icon: HelpCircle,
      color: "bg-white hover:bg-gray-50 border border-gray-300",
      textColor: "text-gray-800"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Types', icon: Building },
    { id: 'property', name: 'Property', icon: Building },
    { id: 'business', name: 'Business', icon: Store },
    { id: 'transport', name: 'Transport', icon: Car },
    { id: 'entertainment', name: 'Entertainment', icon: Building },
    { id: 'services', name: 'Services', icon: Wrench },
  ];

  useEffect(() => {
    fetchRevenueTypes();
  }, []);

  useEffect(() => {
    filterRevenueTypes();
  }, [revenueTypes, searchTerm, selectedCategory]);

  const fetchRevenueTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('revenue_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRevenueTypes(data || []);
    } catch (error) {
      console.error('Error fetching revenue types:', error);
      // Fallback to hardcoded data if database is not available
      setRevenueTypes([
        { code: 'property-tax', name: 'Property Tax', category: 'property', has_zones: true, is_recurring: true, icon: '🏠', is_active: true },
        { code: 'hotel-license', name: 'Hotel License', category: 'entertainment', has_zones: true, is_recurring: true, icon: '🏨', is_active: true },
        { code: 'shop-license', name: 'Shop License', category: 'business', has_zones: true, is_recurring: true, icon: '🏪', is_active: true },
        // Add more as needed for demo
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterRevenueTypes = () => {
    let filtered = revenueTypes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(type => type.category === selectedCategory);
    }

    setFilteredTypes(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'property': return Building;
      case 'business': return Store;
      case 'transport': return Car;
      case 'entertainment': return Building;
      case 'services': return Wrench;
      default: return Building;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Traditional Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/amac-logo.png"
              alt="AMAC Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-gray-800">AMAC</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile App Header Section */}
      <header className="bg-[#006838] text-white py-6 px-4 shadow-lg">
        <div className="max-w-md mx-auto text-center">
          {/* AMAC Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
              <img
                src="/amac-logo.png"
                alt="AMAC Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold mb-2 leading-tight">
            AMAC REVENUE<br/>MOBILE APP
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-green-100">
            (c) 2026 - Abuja Municipal Area Council
          </p>
        </div>
      </header>

      {/* Content Section */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-md mx-auto -mt-4">
          {/* Info Box */}
          <div className="bg-white rounded-t-2xl shadow-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Municipal Area Council to promote the Internally Generated Revenue (IGR) of the Council.... AMAC
            </p>
          </div>

          {/* Main Services Menu */}
          <div className="space-y-3 mb-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`${item.color} ${item.textColor} w-full p-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Assessment System Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">🆕 New Assessment System</h3>
              <button
                onClick={() => setShowAssessmentOptions(!showAssessmentOptions)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAssessmentOptions ? 'Hide' : 'Show'} Options
              </button>
            </div>

            {showAssessmentOptions && (
              <div className="space-y-3">
                {/* Assessment System Options */}
                <Link
                  to="/pay-demand-notice"
                  className="w-full bg-[#006838] text-white p-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">PAY DEMAND NOTICE</div>
                      <div className="text-xs text-green-100">Use phone, notice number, or QR code</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>

                <Link
                  to="/apply-assessment"
                  className="w-full bg-[#1f2937] text-white p-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">APPLY FOR ASSESSMENT</div>
                      <div className="text-xs text-gray-300">New assessment system with AI</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            )}
          </div>

          {/* Revenue Types Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Revenue Types ({filteredTypes.length})</h3>

            {/* Search and Filter */}
            <div className="space-y-3 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search revenue types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent text-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#006838] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue Types List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006838] mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading revenue types...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTypes.map((type) => {
                  const CategoryIcon = getCategoryIcon(type.category);
                  return (
                    <Link
                      key={type.code}
                      to={`/pay?service=${type.code}`}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-[#006838] hover:bg-green-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-[#006838] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{type.name}</div>
                        <div className="text-xs text-gray-600 capitalize">{type.category}</div>
                        {type.base_amount && (
                          <div className="text-xs text-green-600 font-medium">
                            From ₦{type.base_amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional Actions */}
          <div className="space-y-3">
            <Link
              to="/verify-receipt"
              className="w-full bg-white border border-gray-300 p-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-sm">VERIFY A RECEIPT</div>
                  <div className="text-xs text-gray-600">Check if a receipt is genuine</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          </div>

          {/* Bottom spacing for mobile */}
          <div className="h-6"></div>
        </div>
      </main>
    </div>
  );
};

export default Index;
