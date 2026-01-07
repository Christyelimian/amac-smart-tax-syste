import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calculator,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Send,
  Download,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import DemandNoticeGenerator from '../../components/admin/DemandNoticeGenerator';
import AIAssessmentPanel from '../../components/admin/AIAssessmentPanel';

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
  revenue_type?: {
    name: string;
    category: string;
    base_amount?: number;
  };
  zone?: {
    name: string;
    multiplier: number;
  };
}

interface AssessmentFormula {
  formula_type: string;
  formula_expression?: string;
  base_amount?: number;
  rate_table?: any;
}

interface CalculationResult {
  amount: number;
  breakdown: Record<string, any>;
  formula: string;
  justification?: string;
}

const AssessmentReview = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<AssessmentApplication | null>(null);
  const [formula, setFormula] = useState<AssessmentFormula | null>(null);
  const [autoCalculation, setAutoCalculation] = useState<CalculationResult | null>(null);
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [siteInspectionRequired, setSiteInspectionRequired] = useState(false);
  const [siteInspectionNotes, setSiteInspectionNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingNotice, setGeneratingNotice] = useState(false);

  const [showManualAdjustment, setShowManualAdjustment] = useState(false);
  const [assessmentSaved, setAssessmentSaved] = useState(false);
  const [savedAssessmentData, setSavedAssessmentData] = useState<any>(null);
  const [aiAssessmentResult, setAiAssessmentResult] = useState<any>(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('assessment_applications')
        .select(`
          *,
          revenue_type:revenue_types(*),
          zone:zones(*)
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      setApplication(data);

      // Fetch assessment formula
      await fetchFormula(data.revenue_type_code, data.zone_id);

      // Auto-calculate amount
      await calculateAutoAmount(data);

    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load assessment application');
      navigate('/admin/assessment-queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormula = async (revenueTypeCode: string, zoneId: string) => {
    try {
      const { data, error } = await supabase
        .from('assessment_formulas')
        .select('*')
        .eq('revenue_type_code', revenueTypeCode)
        .or(`zone_id.eq.${zoneId},zone_id.is.null`)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      setFormula(data);
    } catch (error) {
      console.error('Error fetching formula:', error);
    }
  };

  const calculateAutoAmount = async (app: AssessmentApplication) => {
    if (!formula) return;

    setCalculating(true);
    try {
      // This would call the formula engine
      // For now, simulate calculation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCalculation: CalculationResult = {
        amount: 1275000,
        breakdown: {
          base_fee: 100000,
          room_charge: 975000,
          category_premium: 200000
        },
        formula: 'base + (rooms * room_rate) + category_premium'
      };

      setAutoCalculation(mockCalculation);
      setManualAmount(mockCalculation.amount);
    } catch (error) {
      console.error('Error calculating amount:', error);
      toast.error('Failed to calculate assessment amount');
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!application) return;

    try {
      setSaving(true);

      const assessmentData = {
        assessment_number: `ASS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        taxpayer_id: null, // Will be linked to user profile later
        revenue_type_code: application.revenue_type_code,
        zone_id: application.zone_id,
        assessment_data: application.application_data,
        assessed_amount: manualAmount,
        calculation_method: showManualAdjustment ? 'manual' : 'formula_based',
        calculation_details: {
          auto_calculated: autoCalculation,
          manual_adjustment: showManualAdjustment ? {
            amount: manualAmount,
            reason: adjustmentReason,
            adjusted_by: 'admin_user' // Will be current user
          } : null
        },
        status: 'approved',
        notes: internalNotes,
        site_inspection_required: siteInspectionRequired,
        site_inspection_notes: siteInspectionNotes,
        assessed_by: 'admin_user', // Will be current user
        assessment_date: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      };

      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Update application status
      const { error: updateError } = await supabase
        .from('assessment_applications')
        .update({
          status: 'assessment_completed',
          reviewed_by: 'admin_user', // Will be current user
          reviewed_at: new Date().toISOString(),
          review_notes: `Assessment completed. Amount: ₦${manualAmount.toLocaleString()}`
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      setAssessmentSaved(true);
      setSavedAssessmentData({
        assessment_number: assessment.assessment_number,
        taxpayer_name: application.applicant_name,
        taxpayer_phone: application.applicant_phone,
        taxpayer_email: application.applicant_email,
        revenue_type: application.revenue_type?.name || application.revenue_type_code,
        zone: application.zone?.name || application.zone_id,
        property_name: application.application_data.business_name || application.application_data.property_name,
        business_address: application.application_data.business_address || application.application_data.address,
        assessed_amount: manualAmount,
        breakdown: {
          auto_calculated: autoCalculation?.amount || 0,
          manual_adjustment: showManualAdjustment ? manualAmount : 0,
          final_amount: manualAmount
        }
      });

      toast.success('Assessment saved successfully! Now generate demand notice.');

    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDemandNotice = async () => {
    if (!application) return;

    try {
      setGeneratingNotice(true);

      // Generate demand notice
      const noticeData = {
        notice_number: `DN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        assessment_id: null, // Will be set after assessment creation
        taxpayer_id: null, // Will be linked to user profile
        revenue_type_code: application.revenue_type_code,
        zone_id: application.zone_id,
        amount_due: manualAmount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        payment_status: 'unpaid'
      };

      const { data: notice, error: noticeError } = await supabase
        .from('demand_notices')
        .insert([noticeData])
        .select()
        .single();

      if (noticeError) throw noticeError;

      toast.success('Demand notice generated successfully!');
      // Here we would trigger PDF generation and notifications

    } catch (error) {
      console.error('Error generating demand notice:', error);
      toast.error('Failed to generate demand notice');
    } finally {
      setGeneratingNotice(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!application) return;

    try {
      const { error } = await supabase
        .from('assessment_applications')
        .update({
          status: 'rejected',
          reviewed_by: 'admin_user',
          reviewed_at: new Date().toISOString(),
          review_notes: 'Application rejected by assessor'
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application rejected');
      navigate('/admin/assessment-queue');

    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006838] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment review...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Assessment application not found</p>
          <button
            onClick={() => navigate('/admin/assessment-queue')}
            className="text-[#006838] font-medium"
          >
            ← Back to queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/assessment-queue')}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Assessment Review
            </h1>
            <p className="text-sm text-gray-600">
              {application.application_number} - {application.applicant_name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectApplication}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="px-4 py-2 bg-[#006838] text-white rounded-lg hover:bg-[#005a2d] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Assessment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Applicant Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{application.applicant_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <p className="text-gray-900">{application.applicant_phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{application.applicant_email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Revenue Type</label>
                    <p className="text-gray-900">{application.revenue_type?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Zone</label>
                    <p className="text-gray-900">{application.zone?.name} (Zone {application.zone_id?.toUpperCase()})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Application Date</label>
                    <p className="text-gray-900">
                      {new Date(application.submitted_at).toLocaleDateString('en-NG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Data */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assessment Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(application.application_data || {}).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-gray-900 mt-1">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Inspection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Site Inspection
              </h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="siteInspection"
                    checked={siteInspectionRequired}
                    onChange={(e) => setSiteInspectionRequired(e.target.checked)}
                    className="w-4 h-4 text-[#006838] border-gray-300 rounded focus:ring-[#006838]"
                  />
                  <label htmlFor="siteInspection" className="text-sm font-medium text-gray-700">
                    Site inspection required before assessment approval
                  </label>
                </div>

                {siteInspectionRequired && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inspection Notes
                    </label>
                    <textarea
                      value={siteInspectionNotes}
                      onChange={(e) => setSiteInspectionNotes(e.target.value)}
                      placeholder="Specify what needs to be inspected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Internal Notes
              </h2>

              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal notes for this assessment..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Amount Calculation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Assessment Amount
              </h2>

              {/* Auto Calculation */}
              {autoCalculation && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Auto-Calculated Amount</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-800 font-medium">Recommended Amount:</span>
                      <span className="text-2xl font-bold text-green-800">
                        ₦{autoCalculation.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      {Object.entries(autoCalculation.breakdown).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">₦{value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-green-700 mt-3">
                      Formula: {autoCalculation.formula}
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Adjustment */}
              <div className="mb-6">
                <button
                  onClick={() => setShowManualAdjustment(!showManualAdjustment)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showManualAdjustment ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showManualAdjustment ? 'Hide' : 'Show'} Manual Adjustment
                </button>

                {showManualAdjustment && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Assessment Amount (₦)
                      </label>
                      <input
                        type="number"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Adjustment
                      </label>
                      <textarea
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Explain why this amount differs from auto-calculation..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Final Amount Display */}
              <div className="bg-[#006838] text-white rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Final Amount:</span>
                  <span className="text-2xl font-bold">
                    ₦{manualAmount.toLocaleString()}
                  </span>
                </div>
                {showManualAdjustment && (
                  <p className="text-sm text-green-100 mt-2">
                    Manually adjusted from auto-calculation
                  </p>
                )}
          </div>
        </div>

        {/* AI Assessment Panel */}
        <AIAssessmentPanel
          revenueType={application.revenue_type?.name || application.revenue_type_code}
          zone={application.zone?.name || application.zone_id}
          assessmentData={application.application_data}
          currentAmount={manualAmount}
          onAssessmentComplete={(assessment) => {
            setAiAssessmentResult(assessment);
            // Optionally auto-apply AI recommendation
            if (window.confirm(`Apply AI recommended amount of ₦${assessment.recommendedAmount.toLocaleString()}?`)) {
              setManualAmount(assessment.recommendedAmount);
              setAdjustmentReason(`AI Assessment: ${assessment.justification}`);
              setShowManualAdjustment(true);
            }
          }}
        />

        {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

              <div className="space-y-3">
                <button
                  onClick={handleSaveAssessment}
                  disabled={saving}
                  className="w-full bg-[#006838] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005a2d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Approve & Save Assessment
                </button>

                <button
                  onClick={handleGenerateDemandNotice}
                  disabled={generatingNotice}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingNotice ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Generate Demand Notice
                </button>

                <button
                  onClick={() => {/* Download PDF */}}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Demand Notice Generator - Show after assessment is saved */}
        {assessmentSaved && savedAssessmentData && (
          <div className="mt-8">
            <DemandNoticeGenerator
              assessmentId={application.id}
              assessmentData={savedAssessmentData}
              onSuccess={(noticeNumber, pdfUrl) => {
                toast.success(`Demand notice ${noticeNumber} generated and sent!`);
                // Optionally navigate back to queue after a delay
                setTimeout(() => {
                  navigate('/admin/assessment-queue');
                }, 3000);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentReview;
