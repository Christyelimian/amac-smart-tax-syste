import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'file';
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
}

interface AssessmentFormData {
  revenue_type_code: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string;
  application_data: Record<string, any>;
  supporting_documents: File[];
}

const AssessmentForm = () => {
  const { revenueTypeCode } = useParams<{ revenueTypeCode: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revenueType, setRevenueType] = useState<any>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [showEstimate, setShowEstimate] = useState(false);

  // Form data
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [documents, setDocuments] = useState<File[]>([]);

  useEffect(() => {
    if (revenueTypeCode) {
      fetchRevenueTypeAndForm();
    }
  }, [revenueTypeCode]);

  const fetchRevenueTypeAndForm = async () => {
    try {
      setLoading(true);

      // Fetch revenue type details
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_types')
        .select('*')
        .eq('code', revenueTypeCode)
        .single();

      if (revenueError) throw revenueError;
      setRevenueType(revenueData);

      // Fetch assessment formula for form fields
      const { data: formulaData, error: formulaError } = await supabase
        .from('assessment_formulas')
        .select('*')
        .eq('revenue_type_code', revenueTypeCode)
        .eq('is_active', true)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (formulaError) {
        console.warn('No formula found, using default fields');
        setFormFields(getDefaultFields(revenueData));
      } else {
        setFormFields(buildFormFields(formulaData));
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Failed to load assessment form');
      navigate('/apply-assessment');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFields = (revenueType: any): FormField[] => {
    const fields: FormField[] = [
      {
        key: 'property_name',
        label: `${revenueType.name} Name/Description`,
        type: 'text',
        required: true,
        placeholder: `Enter ${revenueType.name.toLowerCase()} details`
      },
      {
        key: 'location',
        label: 'Location/Address',
        type: 'textarea',
        required: true,
        placeholder: 'Enter full address'
      }
    ];

    // Add specific fields based on revenue type
    switch (revenueType.category) {
      case 'property':
        fields.push(
          { key: 'property_size_sqm', label: 'Property Size (sqm)', type: 'number', required: true, min: 1 },
          { key: 'property_type', label: 'Property Type', type: 'select', required: true, options: ['residential', 'commercial', 'industrial'] }
        );
        break;
      case 'business':
        fields.push(
          { key: 'business_type', label: 'Business Type', type: 'text', required: true },
          { key: 'annual_revenue', label: 'Estimated Annual Revenue', type: 'number', required: false, min: 0 }
        );
        break;
      case 'entertainment':
        if (revenueType.code === 'hotel-license') {
          fields.push(
            { key: 'hotel_category', label: 'Hotel Category', type: 'select', required: true, options: ['5-star', '4-star', '3-star', '2-star', 'budget'] },
            { key: 'total_rooms', label: 'Total Number of Rooms', type: 'number', required: true, min: 1 },
            { key: 'annual_turnover_estimate', label: 'Annual Turnover Estimate', type: 'number', required: false, min: 0 }
          );
        }
        break;
    }

    return fields;
  };

  const buildFormFields = (formula: any): FormField[] => {
    const fields: FormField[] = [];
    const requiredInputs = formula.required_inputs || {};

    for (const [key, config] of Object.entries(requiredInputs)) {
      const fieldConfig = config as any;
      fields.push({
        key,
        label: fieldConfig.label || key,
        type: fieldConfig.type || 'text',
        required: fieldConfig.required || false,
        placeholder: fieldConfig.placeholder,
        options: fieldConfig.options,
        min: fieldConfig.min,
        max: fieldConfig.max
      });
    }

    return fields;
  };

  const calculateEstimate = async () => {
    if (!Object.keys(formData).length) return;

    try {
      // This would call the formula engine
      // For now, show a placeholder estimate
      setEstimate({
        amount: 50000,
        breakdown: { base_fee: 20000, variable_fee: 30000 },
        formula: 'Estimated calculation'
      });
      setShowEstimate(true);
    } catch (error) {
      console.error('Error calculating estimate:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicantName || !applicantPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Create assessment application
      const applicationData = {
        application_number: `APP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        taxpayer_id: null, // Will be set if user is logged in
        applicant_name: applicantName,
        applicant_phone: applicantPhone,
        applicant_email: applicantEmail,
        revenue_type_code: revenueTypeCode,
        application_data: formData,
        supporting_documents: documents.map(doc => ({
          name: doc.name,
          size: doc.size,
          type: doc.type
        })),
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('assessment_applications')
        .insert([applicationData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Assessment application submitted successfully!');
      navigate(`/application-success/${data.id}`);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-[#006838] mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment form...</p>
        </div>
      </div>
    );
  }

  if (!revenueType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Revenue type not found</p>
          <Link to="/apply-assessment" className="text-[#006838] font-medium">
            ← Back to assessment types
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
            <h1 className="font-bold text-gray-800 truncate">{revenueType.name}</h1>
            <p className="text-xs text-gray-500">Assessment Application</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#006838]" />
              Type Selected
            </span>
            <span className="text-[#006838] font-medium">Fill Form</span>
            <span>Submit</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Applicant Information */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Your Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                  placeholder="08012345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {/* Assessment Details */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4">{revenueType.name} Details</h2>

            <div className="space-y-4">
              {formFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && '*'}
                  </label>

                  {field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                      required={field.required}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                      placeholder={field.placeholder}
                      rows={3}
                      required={field.required}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      type="number"
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Calculate Estimate Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={calculateEstimate}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Calculate Estimated Amount
              </button>
            </div>
          </div>

          {/* Estimate Display */}
          {showEstimate && estimate && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Estimated Amount</h3>
              </div>

              <div className="space-y-2 text-sm">
                {Object.entries(estimate.breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="font-medium">₦{value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-green-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-green-800">
                    <span>Total Estimated:</span>
                    <span>₦{estimate.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-green-700 mt-3">
                ⚠️ This is an estimate only. Final amount will be confirmed after admin review and possible site inspection.
              </p>
            </div>
          )}

          {/* Supporting Documents */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Supporting Documents</h2>

            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload supporting documents</p>
                <p className="text-xs text-gray-500 mb-3">
                  CAC Certificate, Photos, Floor Plans, Operating License, etc.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label
                  htmlFor="document-upload"
                  className="bg-[#006838] text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#005a2d] transition-colors inline-block"
                >
                  Choose Files
                </label>
              </div>

              {/* Uploaded Documents */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#006838] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#005a2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Assessment Application
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              By submitting, you agree to AMAC's assessment process and understand that a site inspection may be required.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
