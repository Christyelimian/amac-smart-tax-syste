// ===========================================
// DEMAND NOTICE PDF GENERATION SERVICE
// ===========================================
// Generates official AMAC demand notices with QR codes
// Handles PDF creation, QR codes, and delivery

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '../integrations/supabase/client';

export interface DemandNoticeData {
  notice_number: string;
  taxpayer_name: string;
  taxpayer_phone: string;
  taxpayer_email?: string;
  revenue_type: string;
  property_name: string;
  business_address: string;
  zone: string;
  amount_due: number;
  issue_date: string;
  due_date: string;
  breakdown: Record<string, number>;
  assessment_number: string;
}

export interface NotificationOptions {
  sendEmail?: boolean;
  sendSMS?: boolean;
  emailTemplate?: string;
  smsTemplate?: string;
}

export class DemandNoticeService {
  private pdf: jsPDF | null = null;

  /**
   * Generate PDF demand notice
   */
  async generateDemandNotice(data: DemandNoticeData): Promise<{
    pdfBlob: Blob;
    qrCodeUrl: string;
    pdfUrl: string;
  }> {
    try {
      // Initialize PDF
      this.pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = this.pdf.internal.pageSize.getWidth();
      const pageHeight = this.pdf.internal.pageSize.getHeight();

      // Generate QR Code
      const qrCodeUrl = await this.generateQRCode(data.notice_number);

      // Add content to PDF
      this.addHeader();
      this.addNoticeDetails(data);
      this.addAmountBreakdown(data);
      this.addPaymentInstructions(data, qrCodeUrl);
      this.addFooter();

      // Generate blob
      const pdfBlob = this.pdf.output('blob');

      // Upload to storage
      const fileName = `demand-notice-${data.notice_number}.pdf`;
      const pdfUrl = await this.uploadPDF(pdfBlob, fileName);

      return {
        pdfBlob,
        qrCodeUrl,
        pdfUrl
      };

    } catch (error) {
      console.error('Error generating demand notice:', error);
      throw new Error('Failed to generate demand notice PDF');
    }
  }

  /**
   * Generate QR code for demand notice
   */
  private async generateQRCode(noticeNumber: string): Promise<string> {
    try {
      // Create QR code data URL
      const qrData = {
        type: 'demand_notice',
        notice_number: noticeNumber,
        payment_url: `${window.location.origin}/pay-demand-notice`,
        generated_at: new Date().toISOString()
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Upload PDF to Supabase storage
   */
  private async uploadPDF(pdfBlob: Blob, fileName: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('demand-notices')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('demand-notices')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw new Error('Failed to upload PDF');
    }
  }

  /**
   * Add AMAC header to PDF
   */
  private addHeader(): void {
    if (!this.pdf) return;

    const pageWidth = this.pdf.internal.pageSize.getWidth();

    // AMAC Logo placeholder (you'd add actual logo)
    this.pdf.setFillColor(0, 102, 51); // AMAC Green
    this.pdf.rect(20, 20, 30, 20, 'F');

    // Header text
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(0, 102, 51);
    this.pdf.text('ABUJA MUNICIPAL AREA COUNCIL', pageWidth / 2, 35, { align: 'center' });

    this.pdf.setFontSize(14);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('REVENUE COLLECTION DEPARTMENT', pageWidth / 2, 45, { align: 'center' });

    // Title
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(0, 102, 51);
    this.pdf.text('DEMAND NOTICE', pageWidth / 2, 65, { align: 'center' });

    // Decorative line
    this.pdf.setDrawColor(0, 102, 51);
    this.pdf.setLineWidth(1);
    this.pdf.line(20, 75, pageWidth - 20, 75);
  }

  /**
   * Add demand notice details
   */
  private addNoticeDetails(data: DemandNoticeData): void {
    if (!this.pdf) return;

    let yPosition = 90;

    // Notice details box
    this.pdf.setFillColor(248, 250, 252); // Light gray background
    this.pdf.rect(20, yPosition - 5, 170, 50, 'F');

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);

    // Notice Number
    this.pdf.text('DEMAND NOTICE NUMBER:', 25, yPosition);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(data.notice_number, 80, yPosition);

    // Issue Date
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DATE ISSUED:', 25, yPosition + 10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(new Date(data.issue_date).toLocaleDateString('en-GB'), 80, yPosition + 10);

    // Due Date
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DUE DATE:', 25, yPosition + 20);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(new Date(data.due_date).toLocaleDateString('en-GB'), 80, yPosition + 20);

    // Taxpayer Details
    yPosition += 60;
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('TAXPAYER DETAILS:', 20, yPosition);

    yPosition += 10;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);

    this.pdf.text(`Name: ${data.taxpayer_name}`, 20, yPosition);
    this.pdf.text(`Phone: ${data.taxpayer_phone}`, 20, yPosition + 8);
    if (data.taxpayer_email) {
      this.pdf.text(`Email: ${data.taxpayer_email}`, 20, yPosition + 16);
    }
  }

  /**
   * Add amount breakdown
   */
  private addAmountBreakdown(data: DemandNoticeData): void {
    if (!this.pdf) return;

    let yPosition = 170;

    // Amount breakdown box
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(20, yPosition - 5, 170, 80, 'F');

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('AMOUNT BREAKDOWN:', 20, yPosition);

    yPosition += 10;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);

    // Breakdown items
    let breakdownY = yPosition;
    Object.entries(data.breakdown).forEach(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      this.pdf!.text(`${label}:`, 25, breakdownY);
      this.pdf!.text(`₦${value.toLocaleString()}`, 140, breakdownY, { align: 'right' });
      breakdownY += 8;
    });

    // Total amount
    this.pdf!.setDrawColor(0, 102, 51);
    this.pdf!.setLineWidth(0.5);
    this.pdf!.line(25, breakdownY + 2, 165, breakdownY + 2);

    this.pdf!.setFont('helvetica', 'bold');
    this.pdf!.setFontSize(12);
    this.pdf!.setTextColor(0, 102, 51);
    this.pdf!.text('TOTAL AMOUNT DUE:', 25, breakdownY + 12);
    this.pdf!.text(`₦${data.amount_due.toLocaleString()}`, 165, breakdownY + 12, { align: 'right' });
  }

  /**
   * Add payment instructions
   */
  private addPaymentInstructions(data: DemandNoticeData, qrCodeUrl: string): void {
    if (!this.pdf) return;

    let yPosition = 270;

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('PAYMENT INSTRUCTIONS:', 20, yPosition);

    yPosition += 10;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    const instructions = [
      '1. Visit amac.abuja.gov.ng or use the AMAC Mobile App',
      '2. Select "Pay Existing Demand Notice"',
      '3. Enter your phone number or scan the QR code below',
      '4. Select this demand notice and complete payment',
      '5. Payment must be made before the due date to avoid penalties',
      '',
      'ALTERNATIVE PAYMENT METHODS:',
      '• Bank Transfer to AMAC Account',
      '• Visit AMAC Revenue Office',
      '• Use AMAC Field Collector Services'
    ];

    instructions.forEach(instruction => {
      this.pdf!.text(instruction, 20, yPosition);
      yPosition += 6;
    });

    // Add QR Code
    if (qrCodeUrl) {
      try {
        this.pdf!.addImage(qrCodeUrl, 'PNG', 130, 280, 50, 50);
        this.pdf!.setFont('helvetica', 'bold');
        this.pdf!.setFontSize(8);
        this.pdf!.text('SCAN TO PAY', 155, 335, { align: 'center' });
      } catch (error) {
        console.warn('Could not add QR code to PDF:', error);
      }
    }
  }

  /**
   * Add footer
   */
  private addFooter(): void {
    if (!this.pdf) return;

    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();

    // Footer line
    this.pdf.setDrawColor(0, 102, 51);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);

    // Footer text
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(128, 128, 128);

    const footerLines = [
      'This is an official demand notice from the Abuja Municipal Area Council (AMAC).',
      'Failure to pay by the due date may result in penalties, enforcement actions, or legal proceedings.',
      'For inquiries, contact AMAC Revenue Department: +234 xxx xxx xxxx | revenue@amac.abuja.gov.ng',
      `Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`
    ];

    let footerY = pageHeight - 30;
    footerLines.forEach(line => {
      this.pdf!.text(line, pageWidth / 2, footerY, { align: 'center' });
      footerY += 5;
    });
  }

  /**
   * Send notifications (Email/SMS)
   */
  async sendNotifications(
    data: DemandNoticeData,
    pdfUrl: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    try {
      // Send email if requested
      if (options.sendEmail && data.taxpayer_email) {
        await this.sendEmail(data, pdfUrl, options.emailTemplate);
      }

      // Send SMS if requested
      if (options.sendSMS) {
        await this.sendSMS(data, pdfUrl, options.smsTemplate);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw new Error('Failed to send notifications');
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    data: DemandNoticeData,
    pdfUrl: string,
    template?: string
  ): Promise<void> {
    const emailData = {
      to: data.taxpayer_email,
      subject: `AMAC Demand Notice - ${data.notice_number}`,
      template: template || 'demand-notice',
      templateData: {
        taxpayer_name: data.taxpayer_name,
        notice_number: data.notice_number,
        amount_due: data.amount_due,
        due_date: data.due_date,
        pdf_url: pdfUrl
      }
    };

    // This would integrate with your email service
    // For now, we'll just log it
    console.log('Sending email:', emailData);
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(
    data: DemandNoticeData,
    pdfUrl: string,
    template?: string
  ): Promise<void> {
    const smsData = {
      to: data.taxpayer_phone,
      message: template?.replace('{{notice_number}}', data.notice_number)
        .replace('{{amount}}', data.amount_due.toString())
        .replace('{{due_date}}', new Date(data.due_date).toLocaleDateString()) ||
        `AMAC Demand Notice ${data.notice_number}: ₦${data.amount_due.toLocaleString()} due by ${new Date(data.due_date).toLocaleDateString()}. Pay at amac.abuja.gov.ng`
    };

    // This would integrate with your SMS service
    // For now, we'll just log it
    console.log('Sending SMS:', smsData);
  }
}

// Export singleton instance
export const demandNoticeService = new DemandNoticeService();
