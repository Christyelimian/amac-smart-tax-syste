import React, { useState } from 'react';
import {
  FileText,
  Download,
  Send,
  Mail,
  MessageSquare,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { demandNoticeService, DemandNoticeData, NotificationOptions } from '../../services/demandNoticeService';

interface DemandNoticeGeneratorProps {
  assessmentId: string;
  assessmentData: {
    assessment_number: string;
    taxpayer_name: string;
    taxpayer_phone: string;
    taxpayer_email?: string;
    revenue_type: string;
    zone: string;
    property_name?: string;
    business_address?: string;
    assessed_amount: number;
    breakdown?: Record<string, number>;
  };
  onSuccess?: (noticeNumber: string, pdfUrl: string) => void;
}

const DemandNoticeGenerator: React.FC<DemandNoticeGeneratorProps> = ({
  assessmentId,
  assessmentData,
  onSuccess
}) => {
  const [generating, setGenerating] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [generatedNotice, setGeneratedNotice] = useState<{
    noticeNumber: string;
    pdfUrl: string;
    qrCodeUrl: string;
  } | null>(null);

  // Notification options
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);

  const handleGenerateNotice = async () => {
    try {
      setGenerating(true);

      // Prepare demand notice data
      const noticeData: DemandNoticeData = {
        notice_number: `DN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        taxpayer_name: assessmentData.taxpayer_name,
        taxpayer_phone: assessmentData.taxpayer_phone,
        taxpayer_email: assessmentData.taxpayer_email,
        revenue_type: assessmentData.revenue_type,
        property_name: assessmentData.property_name || 'Business/Property',
        business_address: assessmentData.business_address || 'Address not specified',
        zone: assessmentData.zone,
        amount_due: assessmentData.assessed_amount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        breakdown: assessmentData.breakdown || { total: assessmentData.assessed_amount },
        assessment_number: assessmentData.assessment_number
      };

      // Generate PDF and QR code
      const result = await demandNoticeService.generateDemandNotice(noticeData);

      setGeneratedNotice({
        noticeNumber: noticeData.notice_number,
        pdfUrl: result.pdfUrl,
        qrCodeUrl: result.qrCodeUrl
      });

      toast.success('Demand notice generated successfully!');

      // Call success callback
      if (onSuccess) {
        onSuccess(noticeData.notice_number, result.pdfUrl);
      }

    } catch (error) {
      console.error('Error generating demand notice:', error);
      toast.error('Failed to generate demand notice');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendNotifications = async () => {
    if (!generatedNotice) return;

    try {
      setSendingNotifications(true);

      const noticeData: DemandNoticeData = {
        notice_number: generatedNotice.noticeNumber,
        taxpayer_name: assessmentData.taxpayer_name,
        taxpayer_phone: assessmentData.taxpayer_phone,
        taxpayer_email: assessmentData.taxpayer_email,
        revenue_type: assessmentData.revenue_type,
        property_name: assessmentData.property_name || 'Business/Property',
        business_address: assessmentData.business_address || 'Address not specified',
        zone: assessmentData.zone,
        amount_due: assessmentData.assessed_amount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        breakdown: assessmentData.breakdown || { total: assessmentData.assessed_amount },
        assessment_number: assessmentData.assessment_number
      };

      const notificationOptions: NotificationOptions = {
        sendEmail,
        sendSMS
      };

      await demandNoticeService.sendNotifications(
        noticeData,
        generatedNotice.pdfUrl,
        notificationOptions
      );

      toast.success('Notifications sent successfully!');

    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error('Failed to send notifications');
    } finally {
      setSendingNotifications(false);
    }
  };

  const handleDownloadPDF = () => {
    if (generatedNotice) {
      window.open(generatedNotice.pdfUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Generate Demand Notice
      </h3>

      {!generatedNotice ? (
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Notice Preview:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Taxpayer:</span>
                <div className="font-medium">{assessmentData.taxpayer_name}</div>
              </div>
              <div>
                <span className="text-gray-600">Amount Due:</span>
                <div className="font-medium text-lg text-green-600">
                  ₦{assessmentData.assessed_amount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Revenue Type:</span>
                <div className="font-medium">{assessmentData.revenue_type}</div>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <div className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG')}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Options */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3">Send Notifications:</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Send Email {assessmentData.taxpayer_email && `to ${assessmentData.taxpayer_email}`}
                  {!assessmentData.taxpayer_email && '(no email on record)'}
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Send SMS to {assessmentData.taxpayer_phone}
                </span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateNotice}
            disabled={generating}
            className="w-full bg-[#006838] hover:bg-[#005a2d] text-white"
          >
            {generating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating Demand Notice...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Demand Notice & Send Notifications
              </>
            )}
          </Button>
        </div>
      ) : (
        /* Generated Notice */
        <div className="space-y-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-800">Demand Notice Generated!</h4>
                <p className="text-sm text-green-700">
                  Notice {generatedNotice.noticeNumber} has been created and notifications sent.
                </p>
              </div>
            </div>
          </div>

          {/* Notice Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Demand Notice Details:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Notice Number:</span>
                <div className="font-medium font-mono">{generatedNotice.noticeNumber}</div>
              </div>
              <div>
                <span className="text-gray-600">Amount Due:</span>
                <div className="font-medium text-lg text-green-600">
                  ₦{assessmentData.assessed_amount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <div className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG')}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="font-medium text-orange-600">Unpaid</div>
              </div>
            </div>
          </div>

          {/* QR Code Preview */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h4 className="font-medium text-gray-800 mb-3">QR Code for Payment:</h4>
            <div className="inline-block">
              <img
                src={generatedNotice.qrCodeUrl}
                alt="Payment QR Code"
                className="w-32 h-32 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-600 mt-2">
                Taxpayers can scan this QR code to pay
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>

            <Button
              onClick={handleSendNotifications}
              disabled={sendingNotifications}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {sendingNotifications ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Resend Notifications
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Next Steps:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Taxpayer will receive email/SMS with payment link</li>
                  <li>• They can pay using the demand notice number or QR code</li>
                  <li>• Monitor payment status in the transactions dashboard</li>
                  <li>• Follow up on overdue payments after due date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandNoticeGenerator;
