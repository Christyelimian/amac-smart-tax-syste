import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Phone,
  FileText,
  QrCode,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader,
  Camera,
  CameraOff
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Note: For production, install jsQR: npm install jsqr
// For now, we'll simulate QR detection

const DemandNoticePayment = () => {
  const [searchMethod, setSearchMethod] = useState<'phone' | 'notice' | 'qr' | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [demandNotices, setDemandNotices] = useState<any[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [showSelection, setShowSelection] = useState(false);

  // Camera/QR code scanning state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setSearching(true);
    setDemandNotices([]);
    setSelectedNotice(null);
    setShowSelection(false);

    try {
      // Simulate API call to search for demand notices
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock data for testing - simulates real database responses
      let mockNotices = [];

      if (searchMethod === 'phone') {
        // Test phone numbers that return different results
        const testPhone = searchValue.trim();

        if (testPhone === '0801234567' || testPhone === '08012345678') {
          // Multiple businesses for John Doe
          mockNotices = [
            {
              id: 1,
              notice_number: 'DN-2026-001234',
              taxpayer_name: 'John Doe',
              taxpayer_phone: '0801234567',
              taxpayer_email: 'john@email.com',
              revenue_type: 'Hotel License (Annual)',
              property_name: 'Transcorp Hilton Hotel',
              business_address: 'Aguiyi Ironsi St, Maitama, Abuja',
              zone: 'A',
              amount_due: 1275000,
              issue_date: '2026-01-01',
              due_date: '2026-01-31',
              status: 'unpaid',
              breakdown: {
                base_fee: 100000,
                room_charge: 975000,
                category_premium: 200000
              }
            },
            {
              id: 2,
              notice_number: 'DN-2026-001235',
              taxpayer_name: 'John Doe',
              taxpayer_phone: '0801234567',
              taxpayer_email: 'john@email.com',
              revenue_type: 'Shop License (Annual)',
              property_name: 'John Doe Supermarket',
              business_address: 'Wuse Market, Wuse II, Abuja',
              zone: 'A',
              amount_due: 75000,
              issue_date: '2026-01-01',
              due_date: '2026-01-31',
              status: 'unpaid',
              breakdown: {
                base_fee: 25000,
                size_premium: 35000,
                location_premium: 15000
              }
            },
            {
              id: 3,
              notice_number: 'DN-2026-001236',
              taxpayer_name: 'John Doe',
              taxpayer_phone: '0801234567',
              taxpayer_email: 'john@email.com',
              revenue_type: 'Restaurant License (Annual)',
              property_name: 'JD Fast Food Restaurant',
              business_address: 'Area 11, Garki, Abuja',
              zone: 'B',
              amount_due: 125000,
              issue_date: '2026-01-01',
              due_date: '2026-01-31',
              status: 'unpaid',
              breakdown: {
                base_fee: 35000,
                capacity_premium: 65000,
                category_premium: 25000
              }
            }
          ];
          setDemandNotices(mockNotices);
          setShowSelection(true);
          toast.success(`Found ${mockNotices.length} unpaid demand notices for John Doe`);

        } else if (testPhone === '08123456789') {
          // Single business for Mary Johnson
          mockNotices = [
            {
              id: 4,
              notice_number: 'DN-2026-002001',
              taxpayer_name: 'Mary Johnson',
              taxpayer_phone: '08123456789',
              taxpayer_email: 'mary.johnson@email.com',
              revenue_type: 'Shop License (Annual)',
              property_name: 'MJ Fashion Boutique',
              business_address: 'Silverbird Galleria, Abuja',
              zone: 'A',
              amount_due: 95000,
              issue_date: '2026-01-15',
              due_date: '2026-02-14',
              status: 'unpaid',
              breakdown: {
                base_fee: 25000,
                size_premium: 45000,
                prime_location_premium: 25000
              }
            }
          ];
          setDemandNotices(mockNotices);
          setSelectedNotice(mockNotices[0]);
          toast.success('Found 1 unpaid demand notice for Mary Johnson');

        } else if (testPhone === '09087654321') {
          // Overdue payment for Ahmed Hassan
          mockNotices = [
            {
              id: 5,
              notice_number: 'DN-2025-009876',
              taxpayer_name: 'Ahmed Hassan',
              taxpayer_phone: '09087654321',
              taxpayer_email: 'ahmed.hassan@email.com',
              revenue_type: 'Property Tax (Annual)',
              property_name: 'Residential Property',
              business_address: 'Wuse II, Abuja',
              zone: 'A',
              amount_due: 285000,
              issue_date: '2025-12-01',
              due_date: '2025-12-31',
              status: 'overdue',
              breakdown: {
                base_rate: 45000,
                size_multiplier: 2.5,
                location_premium: 195000
              }
            }
          ];
          setDemandNotices(mockNotices);
          setSelectedNotice(mockNotices[0]);
          toast.success('Found 1 overdue demand notice for Ahmed Hassan');

        } else {
          // No results found
          toast.error(`No demand notices found for phone number ${testPhone}`);
          return;
        }

      } else if (searchMethod === 'notice') {
        // Test notice numbers
        const testNotice = searchValue.trim().toUpperCase();

        const noticeMap: { [key: string]: any } = {
          'DN-2026-001234': {
            id: 1,
            notice_number: 'DN-2026-001234',
            taxpayer_name: 'John Doe',
            taxpayer_phone: '0801234567',
            taxpayer_email: 'john@email.com',
            revenue_type: 'Hotel License (Annual)',
            property_name: 'Transcorp Hilton Hotel',
            business_address: 'Aguiyi Ironsi St, Maitama, Abuja',
            zone: 'A',
            amount_due: 1275000,
            issue_date: '2026-01-01',
            due_date: '2026-01-31',
            status: 'unpaid',
            breakdown: { base_fee: 100000, room_charge: 975000, category_premium: 200000 }
          },
          'DN-2026-001235': {
            id: 2,
            notice_number: 'DN-2026-001235',
            taxpayer_name: 'John Doe',
            taxpayer_phone: '0801234567',
            taxpayer_email: 'john@email.com',
            revenue_type: 'Shop License (Annual)',
            property_name: 'John Doe Supermarket',
            business_address: 'Wuse Market, Wuse II, Abuja',
            zone: 'A',
            amount_due: 75000,
            issue_date: '2026-01-01',
            due_date: '2026-01-31',
            status: 'unpaid',
            breakdown: { base_fee: 25000, size_premium: 35000, location_premium: 15000 }
          },
          'DN-2026-002001': {
            id: 4,
            notice_number: 'DN-2026-002001',
            taxpayer_name: 'Mary Johnson',
            taxpayer_phone: '08123456789',
            taxpayer_email: 'mary.johnson@email.com',
            revenue_type: 'Shop License (Annual)',
            property_name: 'MJ Fashion Boutique',
            business_address: 'Silverbird Galleria, Abuja',
            zone: 'A',
            amount_due: 95000,
            issue_date: '2026-01-15',
            due_date: '2026-02-14',
            status: 'unpaid',
            breakdown: { base_fee: 25000, size_premium: 45000, prime_location_premium: 25000 }
          },
          'DN-2025-009876': {
            id: 5,
            notice_number: 'DN-2025-009876',
            taxpayer_name: 'Ahmed Hassan',
            taxpayer_phone: '09087654321',
            taxpayer_email: 'ahmed.hassan@email.com',
            revenue_type: 'Property Tax (Annual)',
            property_name: 'Residential Property',
            business_address: 'Wuse II, Abuja',
            zone: 'A',
            amount_due: 285000,
            issue_date: '2025-12-01',
            due_date: '2025-12-31',
            status: 'overdue',
            breakdown: { base_rate: 45000, size_multiplier: 2.5, location_premium: 195000 }
          }
        };

        const mockNotice = noticeMap[testNotice];

        if (mockNotice) {
          setDemandNotices([mockNotice]);
          setSelectedNotice(mockNotice);
          toast.success(`Demand notice ${testNotice} found!`);
        } else {
          toast.error(`Demand notice ${testNotice} not found. Try: DN-2026-001234, DN-2026-001235, DN-2026-002001, or DN-2025-009876`);
          return;
        }
      }

    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedNotice) {
      toast.error('No demand notice selected');
      return;
    }

    try {
      setIsProcessing(true);
      toast.info('Initializing payment...');
      
      // Prepare payment data from the selected demand notice
      const paymentData = {
        revenueType: selectedNotice.revenue_type || 'GENERAL_PAYMENT',
        serviceName: selectedNotice.revenue_type || 'General Payment',
        amount: selectedNotice.amount_due,
        payerName: selectedNotice.taxpayer_name,
        payerPhone: selectedNotice.taxpayer_phone,
        payerEmail: selectedNotice.taxpayer_email || undefined,
        businessAddress: selectedNotice.business_address || undefined,
        registrationNumber: selectedNotice.registration_number || undefined,
        zone: selectedNotice.zone ? `zone_${selectedNotice.zone.toLowerCase()}` : undefined,
        notes: `Payment for demand notice ${selectedNotice.notice_number}`
      };

      console.log('📋 Payment data:', paymentData);

      // Try to initialize payment with the local server
      const response = await fetch('http://localhost:3001/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      console.log('✅ Payment initialized:', result);
      toast.success('Payment initialized successfully!');
      
      // Redirect to Remita payment page
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  // Camera/QR code scanning functions
  const startCamera = async () => {
    try {
      setCameraError(null);

      // Check if connection is secure (HTTPS required for camera)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS. Please use a secure connection.');
      }

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device/browser. Try using a mobile device or manual entry.');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        toast.success('Camera activated - point at QR code');

        // Start scanning for QR codes
        scanQRCode();
      }
    } catch (error) {
      console.error('Camera error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    let scanCount = 0;
    const maxScans = 300; // Stop after ~10 seconds at 30fps

    const scan = () => {
      if (!cameraActive || scanCount >= maxScans) return;

      try {
        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simulate QR code detection (replace with actual jsQR library)
        scanCount++;

        // For demo: simulate finding a QR code after a few seconds
        // Cycle through different test notices for variety
        const testNotices = ['DN-2026-001234', 'DN-2026-001235', 'DN-2026-002001', 'DN-2025-009876'];
        const noticeIndex = Math.floor(scanCount / 50) % testNotices.length; // Change every ~1.5 seconds

        if (scanCount === 100 + (noticeIndex * 50)) { // Staggered timing
          const mockQRData = {
            type: 'demand_notice',
            notice_number: testNotices[noticeIndex],
            payment_url: `${window.location.origin}/pay-demand-notice`,
            generated_at: new Date().toISOString()
          };

          handleQRCodeDetected(JSON.stringify(mockQRData));
          return;
        }

        // Continue scanning
        requestAnimationFrame(scan);
      } catch (error) {
        console.error('QR scan error:', error);
      }
    };

    // Start scanning loop
    requestAnimationFrame(scan);

    // Show scanning message
    toast.info('Scanning for QR code... Point camera at demand notice');
  };

  const handleQRCodeDetected = (qrData: string) => {
    try {
      // Parse QR code data
      const data = JSON.parse(qrData);

      if (data.type === 'demand_notice' && data.notice_number) {
        // Auto-fill search with detected notice number
        setSearchMethod('notice');
        setSearchValue(data.notice_number);
        toast.success(`QR Code detected: ${data.notice_number}`);
        stopCamera();

        // Optionally auto-search
        // handleSearch();
      } else {
        toast.error('Invalid QR code format');
      }
    } catch (error) {
      toast.error('Failed to parse QR code data');
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-800">Pay Demand Notice</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Instructions - Always visible when not showing selection or selected notice */}
          {!showSelection && !selectedNotice && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">How to find your demand notice:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Use the demand notice number (DN-2026-XXXXXX) for specific payment</li>
                      <li>• Enter your phone number to see ALL your unpaid bills</li>
                      <li>• Scan the QR code from your demand notice</li>
                    </ul>
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      💡 Tip: If you have multiple businesses, search by phone number to see all your bills
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Methods */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="font-semibold text-gray-800 mb-4">Find Your Demand Notice</h2>

                <div className="space-y-3">
                  {/* Phone Number Search */}
                  <button
                    onClick={() => setSearchMethod('phone')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      searchMethod === 'phone'
                        ? 'border-[#006838] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        searchMethod === 'phone' ? 'bg-[#006838] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Phone Number</div>
                        <div className="text-sm text-gray-600">Enter your registered phone number</div>
                      </div>
                    </div>
                  </button>

                  {/* Demand Notice Number Search */}
                  <button
                    onClick={() => setSearchMethod('notice')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      searchMethod === 'notice'
                        ? 'border-[#006838] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        searchMethod === 'notice' ? 'bg-[#006838] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Demand Notice Number</div>
                        <div className="text-sm text-gray-600">DN-2026-XXXXXX format</div>
                      </div>
                    </div>
                  </button>

                  {/* QR Code Search */}
                  <button
                    onClick={() => setSearchMethod('qr')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      searchMethod === 'qr'
                        ? 'border-[#006838] bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        searchMethod === 'qr' ? 'bg-[#006838] text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Scan QR Code</div>
                        <div className="text-sm text-gray-600">From your demand notice</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Search Input */}
              {searchMethod && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {searchMethod === 'phone' && 'Enter Phone Number'}
                        {searchMethod === 'notice' && 'Enter Demand Notice Number'}
                        {searchMethod === 'qr' && (
                          <div>
                            Scan QR Code
                            <p className="text-xs text-gray-500 mt-1">
                              Point camera at QR code on your demand notice
                            </p>
                          </div>
                        )}
                      </label>

                      {searchMethod === 'qr' ? (
                        <div className="space-y-4">
                          {/* Camera View */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                            {!cameraActive ? (
                              <div className="p-8 text-center">
                                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 mb-2">
                                  Scan QR code from your demand notice
                                </p>
                                <p className="text-xs text-gray-500 mb-4">
                                  Works on mobile devices and desktop with camera<br/>
                                  <strong>Note:</strong> Requires HTTPS and camera permission
                                </p>
                                {cameraError && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-red-800 font-medium">Camera Error:</p>
                                    <p className="text-sm text-red-700">{cameraError}</p>
                                    <p className="text-xs text-red-600 mt-1">
                                      Try using a mobile device or switch to manual entry
                                    </p>
                                  </div>
                                )}
                                <button
                                  onClick={startCamera}
                                  className="bg-[#006838] text-white px-6 py-2 rounded-lg hover:bg-[#005a2d] transition-colors flex items-center gap-2 mx-auto"
                                >
                                  <Camera className="w-4 h-4" />
                                  Open Camera
                                </button>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs text-gray-500 mb-2">Don't have a camera?</p>
                                  <button
                                    onClick={() => setSearchMethod('notice')}
                                    className="text-[#006838] hover:text-[#005a2d] text-sm font-medium"
                                  >
                                    Enter Notice Number Manually →
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-64 bg-black"
                                  style={{ objectFit: 'cover' }}
                                />
                                <canvas
                                  ref={canvasRef}
                                  className="hidden"
                                />
                                <div className="absolute top-2 right-2">
                                  <button
                                    onClick={stopCamera}
                                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <CameraOff className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                                  <div className="bg-black bg-opacity-50 text-white text-sm px-3 py-2 rounded">
                                    Scanning... (Demo: QR detected in 3-5 seconds)
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSearchMethod('notice');
                                      stopCamera();
                                    }}
                                    className="bg-white bg-opacity-20 text-white text-sm px-3 py-2 rounded hover:bg-opacity-30 transition-colors"
                                  >
                                    Manual Entry
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Manual Entry Option */}
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Or enter notice number manually:</p>
                            <button
                              onClick={() => setSearchMethod('notice')}
                              className="text-[#006838] hover:text-[#005a2d] text-sm font-medium"
                            >
                              Switch to Manual Entry →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <input
                          type={searchMethod === 'phone' ? 'tel' : 'text'}
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder={
                            searchMethod === 'phone' ? '08012345678' : 'DN-2026-001234'
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006838] focus:border-transparent"
                        />
                      )}
                    </div>

                    <button
                      onClick={handleSearch}
                      disabled={searching || !searchValue.trim()}
                      className="w-full bg-[#006838] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#005a2d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {searching ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Search Demand Notice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Multiple Notices Selection */}
          {showSelection && demandNotices.length > 0 && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Multiple Demand Notices Found</h3>
                    <p className="text-sm text-blue-700">
                      You have {demandNotices.length} unpaid demand notice{demandNotices.length > 1 ? 's' : ''}.
                      Please select which one you want to pay.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {demandNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#006838] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedNotice(notice);
                      setShowSelection(false);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#006838] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {notice.zone}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{notice.property_name}</h3>
                            <p className="text-sm text-gray-600">{notice.revenue_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">₦{notice.amount_due.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{notice.notice_number}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Address:</span>
                          <div className="font-medium text-gray-900">{notice.business_address}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Due Date:</span>
                          <div className={`font-medium ${getDaysLeft(notice.due_date) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(notice.due_date).toLocaleDateString()}
                            {getDaysLeft(notice.due_date) >= 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({getDaysLeft(notice.due_date)} days left)
                              </span>
                            )}
                            {getDaysLeft(notice.due_date) < 0 && (
                              <span className="text-xs text-red-500 ml-1">
                                (Overdue)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button className="w-full bg-[#006838] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#005a2d] transition-colors">
                          Pay This Bill
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setDemandNotices([]);
                    setShowSelection(false);
                    setSearchValue('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Search for different demand notices
                </button>
              </div>
            </>
          )}

          {/* Selected Notice Details */}
          {selectedNotice && !showSelection && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Demand Notice Found!</h3>
                    <p className="text-sm text-green-700">Review the details below and proceed to payment.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="font-semibold text-gray-800">{selectedNotice.property_name}</h2>
                      <p className="text-sm text-gray-600">{selectedNotice.revenue_type}</p>
                    </div>
                    <div className="w-10 h-10 bg-[#006838] text-white rounded-lg flex items-center justify-center font-bold">
                      {selectedNotice.zone}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notice Number:</span>
                      <span className="font-medium text-gray-900">{selectedNotice.notice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxpayer Name:</span>
                      <span className="font-medium text-gray-900">{selectedNotice.taxpayer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Address:</span>
                      <span className="font-medium text-gray-900 text-right">{selectedNotice.business_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date:</span>
                      <span className="font-medium text-gray-900">{new Date(selectedNotice.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className={`font-medium ${getDaysLeft(selectedNotice.due_date) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(selectedNotice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-800 mb-3">Fee Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedNotice.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium text-gray-900">₦{(value as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Amount Due:</span>
                      <span className="text-2xl font-bold text-[#006838]">₦{selectedNotice.amount_due.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-[#006838] text-white py-4 px-4 rounded-lg font-semibold hover:bg-[#005a2d] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay Now with Remita
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setSelectedNotice(null);
                    setDemandNotices([]);
                    setSearchValue('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Search for a different notice
                </button>
              </div>
            </>
          )}

          {/* Help Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Can't find your demand notice? Contact our support team for assistance.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>📞 Phone: +234 xxx xxx xxxx</p>
              <p>📧 Email: support@amac.abuja.gov.ng</p>
              <p>🏢 Visit: AMAC Headquarters, Maitama</p>
            </div>

            {/* Testing Information */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">🧪 Testing Data (Demo Only)</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Phone Numbers:</strong></p>
                <p>• 0801234567 - John Doe (3 businesses)</p>
                <p>• 08123456789 - Mary Johnson (1 business)</p>
                <p>• 09087654321 - Ahmed Hassan (overdue)</p>
                <p><strong>Notice Numbers:</strong></p>
                <p>• DN-2026-001234 - Hilton Hotel</p>
                <p>• DN-2026-001235 - Supermarket</p>
                <p>• DN-2026-002001 - Fashion Boutique</p>
                <p>• DN-2025-009876 - Overdue Property Tax</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandNoticePayment;