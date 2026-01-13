import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ArrowRight, CreditCard, Loader2, FileText, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ApplicationSuccess = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      setApplication(data);
    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application details');
      navigate('/apply-assessment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!application) return;
    
    setIsProcessing(true);
    
    try {
      // Create a demand notice from the assessment application
      const demandNoticeData = {
        notice_number: `DN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        assessment_application_id: application.id,
        taxpayer_name: application.applicant_name,
        taxpayer_phone: application.applicant_phone,
        taxpayer_email: application.applicant_email,
        revenue_type: application.revenue_type_code,
        amount_due: application.estimated_amount || 0,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: 'unpaid',
        assessment_data: application.application_data
      };

      const { data: notice, error: noticeError } = await supabase
        .from('demand_notices')
        .insert([demandNoticeData])
        .select()
        .single();

      if (noticeError) throw noticeError;

      toast.success('Demand notice created! Redirecting to payment...');
      
      // Navigate to demand notice payment with the new notice
      navigate(`/demand-notice-payment?notice=${notice.notice_number}`);
      
    } catch (error) {
      console.error('Error creating demand notice:', error);
      toast.error('Failed to create demand notice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#006838] mx-auto mb-4" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Application not found</p>
          <Link 
            to="/apply-assessment" 
            className="text-[#006838] font-medium hover:text-[#004d2a]"
          >
            ← Back to Assessment Types
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/apply-assessment" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate">Application Received</h1>
            <p className="text-xs text-gray-500">Assessment Success</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm p-6 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Application Submitted Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your assessment application has been received and is being processed.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Application Number:</span>
                <span className="font-mono font-bold text-green-700">
                  {application.application_number}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-700">
                  {application.status === 'approved' ? 'Approved' : 'Under Review'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium">
                  {formatDate(application.submitted_at)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Assessment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-4"
          >
            <h3 className="font-semibold text-gray-800 mb-3">Application Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue Type:</span>
                <span className="font-medium text-gray-800">{application.revenue_type_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applicant Name:</span>
                <span className="font-medium text-gray-800">{application.applicant_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium text-gray-800">{application.applicant_phone}</span>
              </div>
              {application.estimated_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Amount:</span>
                  <span className="font-bold text-[#006838]">
                    {formatAmount(application.estimated_amount)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Options */}
          {application.status === 'approved' && application.estimated_amount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <h3 className="font-semibold text-gray-800 mb-3">Payment Required</h3>
              
              <div className="bg-[#006838]/5 border border-[#006838]/20 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Assessment Amount</p>
                  <p className="text-2xl font-bold text-[#006838]">
                    {formatAmount(application.estimated_amount)}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full bg-[#006838] text-white rounded-xl py-3 font-medium hover:bg-[#004d2a] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay Assessment Fee →
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-blue-700">
              {application.status !== 'approved' ? (
                <>
                  <p>• Your application is under review by our assessment team</p>
                  <p>• You'll receive an SMS/email when assessment is complete</p>
                  <p>• Assessment typically takes 2-3 business days</p>
                  <p>• You can check status using your application number</p>
                </>
              ) : (
                <>
                  <p>• Your assessment has been approved! 🎉</p>
                  <p>• A demand notice has been generated for payment</p>
                  <p>• Pay now to complete your registration</p>
                  <p>• Receipt will be issued immediately after payment</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <button
              onClick={() => window.print()}
              className="w-full border border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
            >
              Print Application
            </button>
            
            <Link
              to="/apply-assessment"
              className="w-full border border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              New Application
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSuccess;