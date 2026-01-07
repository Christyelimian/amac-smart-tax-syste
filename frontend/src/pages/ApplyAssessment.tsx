import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Hotel,
  Store,
  Car,
  Wrench,
  Calculator,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface RevenueType {
  code: string;
  name: string;
  category: string;
  description?: string;
  icon: string;
}

const ApplyAssessment = () => {
  const navigate = useNavigate();
  const [revenueTypes, setRevenueTypes] = useState<RevenueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchRevenueTypes();
  }, []);

  const fetchRevenueTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue_types')
        .select('code, name, category, description, icon')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRevenueTypes(data || []);
    } catch (error) {
      console.error('Error fetching revenue types:', error);
      toast.error('Failed to load revenue types');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Types', icon: Building },
    { id: 'property', name: 'Property', icon: Building },
    { id: 'business', name: 'Business', icon: Store },
    { id: 'transport', name: 'Transport', icon: Car },
    { id: 'entertainment', name: 'Entertainment', icon: Hotel },
    { id: 'services', name: 'Services', icon: Wrench },
  ];

  const filteredTypes = revenueTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || type.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'property': return Building;
      case 'business': return Store;
      case 'transport': return Car;
      case 'entertainment': return Hotel;
      case 'services': return Wrench;
      default: return Building;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006838] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-800">Apply for Assessment</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Assessment Process:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Select your revenue type below</li>
                  <li>Fill out the assessment application form</li>
                  <li>Upload supporting documents</li>
                  <li>Submit for admin review</li>
                  <li>Receive demand notice with final amount</li>
                  <li>Pay using the demand notice</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <input
              type="text"
              placeholder="Search revenue types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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

          {/* Revenue Types Grid */}
          <div className="space-y-4">
            {filteredTypes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No revenue types found matching your search.</p>
              </div>
            ) : (
              filteredTypes.map((type) => {
                const IconComponent = getCategoryIcon(type.category);
                return (
                  <Link
                    key={type.code}
                    to={`/assessment-form/${type.code}`}
                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all duration-200 block group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#006838] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#006838] transition-colors">
                          {type.name}
                        </h3>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {type.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Not sure which revenue type applies to you? Contact our assessment team for guidance.
            </p>
            <div className="text-sm text-gray-500">
              <p>📞 Phone: +234 xxx xxx xxxx</p>
              <p>📧 Email: assessment@amac.abuja.gov.ng</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyAssessment;
