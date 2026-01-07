import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Users,
  FileText,
  Calculator,
  Edit3,
  Send,
  Download
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface AssessmentApplication {
  id: string;
  application_number: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string;
  revenue_type_code: string;
  zone_id: string;
  application_data: any;
  status: string;
  submitted_at: string;
  created_at: string;
  revenue_type?: {
    name: string;
    category: string;
  };
}

interface AssessmentStats {
  total_pending: number;
  total_today: number;
  total_this_week: number;
  urgent_overdue: number;
}

const AssessmentQueue = () => {
  const [applications, setApplications] = useState<AssessmentApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AssessmentApplication[]>([]);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<AssessmentApplication | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_applications')
        .select(`
          *,
          revenue_type:revenue_types(name, category)
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load assessment applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_applications')
        .select('status, submitted_at')
        .eq('status', 'submitted');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total_pending: data?.length || 0,
        total_today: data?.filter(app => new Date(app.submitted_at) >= today).length || 0,
        total_this_week: data?.filter(app => new Date(app.submitted_at) >= weekAgo).length || 0,
        urgent_overdue: 0 // We'll implement overdue logic later
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant_phone.includes(searchTerm) ||
        app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.revenue_type?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.revenue_type?.category === typeFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'property': return Building;
      case 'business': return Users;
      case 'transport': return MapPin;
      case 'entertainment': return Calendar;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysSinceSubmission = (submittedAt: string) => {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006838] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Queue</h1>
              <p className="text-gray-600">Review and process assessment applications</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#006838] text-white px-4 py-2 rounded-lg hover:bg-[#005a2d] transition-colors">
                <FileText className="w-4 h-4 inline mr-2" />
                Generate Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_pending}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Submitted Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_today}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_this_week}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent (7+ days)</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgent_overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="property">Property</option>
              <option value="business">Business</option>
              <option value="transport">Transport</option>
              <option value="entertainment">Entertainment</option>
              <option value="services">Services</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((application) => {
                const CategoryIcon = getCategoryIcon(application.revenue_type?.category || 'business');
                const daysSince = getDaysSinceSubmission(application.submitted_at);

                return (
                  <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-[#006838] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="w-6 h-6" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.applicant_name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {daysSince >= 7 && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                URGENT ({daysSince} days)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span>{application.application_number}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>{application.revenue_type?.name || application.revenue_type_code}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{application.applicant_phone}</span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 mb-3">
                            Submitted {formatDate(application.submitted_at)}
                          </div>

                          {/* Quick Assessment Data Preview */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assessment Details:</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {Object.entries(application.application_data || {}).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Link
                          to={`/admin/assessment-review/${application.id}`}
                          className="bg-[#006838] text-white px-4 py-2 rounded-lg hover:bg-[#005a2d] transition-colors flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentQueue;
