import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  receipt: any;
  error?: string;
}

export default function ReceiptVerification() {
  const { user } = useAuth();
  const [receiptNumber, setReceiptNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setVerificationResult(null);

    try {
      const token = localStorage.getItem('amac_admin_token');
      
      // For now, simulate verification (in production, this would call the actual verification endpoint)
      // Since we're using MongoDB, we'll check the database directly
      
      const response = await fetch(`http://localhost:3004/api/receipts/${receiptNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationResult({
          isValid: true,
          receipt: data.receipt
        });
      } else {
        const errorData = await response.json();
        setVerificationResult({
          isValid: false,
          receipt: null,
          error: errorData.error || 'Receipt not found'
        });
      }
    } catch (error) {
      setVerificationResult({
        isValid: false,
        receipt: null,
        error: 'Failed to verify receipt'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Please login to verify receipts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Receipt Verification</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleVerify} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Receipt Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g., AMAC/2026/WEB/123456"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !receiptNumber.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Verifying...' : 'Verify Receipt'}
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {verificationResult.isValid ? (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <h2 className="text-xl font-bold text-green-700">Receipt is Authentic</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Receipt Details</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-gray-500">Receipt Number:</dt>
                        <dd className="font-mono font-semibold text-gray-900">{verificationResult.receipt.receipt_number}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Payment Reference:</dt>
                        <dd className="font-mono text-gray-900">{verificationResult.receipt.reference}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Amount Paid:</dt>
                        <dd className="font-bold text-green-600">{formatAmount(verificationResult.receipt.amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Service:</dt>
                        <dd className="text-gray-900">{verificationResult.receipt.service_name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Generated On:</dt>
                        <dd className="text-gray-900">{new Date(verificationResult.receipt.generated_at).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Payer Information</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-gray-500">Name:</dt>
                        <dd className="text-gray-900">{verificationResult.receipt.payer_name}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Email:</dt>
                        <dd className="text-gray-900">{verificationResult.receipt.payer_email}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Phone:</dt>
                        <dd className="text-gray-900">{verificationResult.receipt.payer_phone}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Payment Method:</dt>
                        <dd className="text-gray-900">{verificationResult.receipt.payment_method}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Payment Date:</dt>
                        <dd className="text-gray-900">{new Date(verificationResult.receipt.paid_at).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>Verification Status:</strong> This receipt has been verified and is authentic. 
                    It was successfully processed and recorded in the AMAC payment system.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <XCircle className="w-8 h-8 text-red-500 mr-3" />
                  <h2 className="text-xl font-bold text-red-700">Receipt Verification Failed</h2>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    <strong>Error:</strong> {verificationResult.error}
                  </p>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Possible Reasons:</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Receipt number may be incorrect or contain typos</li>
                    <li>• Receipt may not exist in our system</li>
                    <li>• Receipt may have been issued for a different transaction</li>
                    <li>• System error during verification</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!verificationResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">How to Verify Receipts:</h3>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Enter the complete receipt number (including AMAC prefix)</li>
              <li>2. Click "Verify Receipt" to check authenticity</li>
              <li>3. Review the verification results and payment details</li>
              <li>4. Contact support if you need further assistance</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}