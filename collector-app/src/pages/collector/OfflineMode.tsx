import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, Home, Clock, CheckCircle, Database, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OfflineMode() {
  const { isOnline, pendingSyncCount, syncData } = useOffline();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleTrySync = () => {
    if (isOnline) {
      syncData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">You're Offline</CardTitle>
            <CardDescription className="text-gray-600">
              Don't worry! AMAC works offline. You can still access some features while you're disconnected.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Button 
              onClick={handleGoHome}
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>

            {isOnline && pendingSyncCount > 0 && (
              <Button 
                onClick={handleTrySync}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Database className="w-4 h-4 mr-2" />
                Sync {pendingSyncCount} Pending Items
              </Button>
            )}

            <div className="text-left space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Available Offline:
              </h3>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Clock className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                  <span className="text-sm text-gray-600">View your dashboard and recent collections</span>
                </li>
                <li className="flex items-start">
                  <Database className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                  <span className="text-sm text-gray-600">Access saved data and payment history</span>
                </li>
                <li className="flex items-start">
                  <Navigation className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                  <span className="text-sm text-gray-600">Navigate between pages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                  <span className="text-sm text-gray-600">Collect payments (will sync when online)</span>
                </li>
              </ul>
            </div>

            {pendingSyncCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  <strong>{pendingSyncCount}</strong> payment(s) will sync automatically when you're back online.
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                {isOnline ? (
                  <span className="text-green-600">Connection restored! Some features may be limited.</span>
                ) : (
                  "The app will automatically sync when your connection is restored."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}