import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, WifiOff, Battery } from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { useLocation } from '@/contexts/LocationContext';

export default function Login() {
  const { login } = useAuth();
  const { isOnline } = useOffline();
  const { locationEnabled, currentLocation } = useLocation();
  const [collectorId, setCollectorId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock battery level
  const batteryLevel = 85;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectorId || !pin) return;

    setIsLoading(true);
    try {
      const success = await login(collectorId, pin);
      if (!success) {
        // Error is handled in the auth context
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">🏛️</span>
          </div>
          <CardTitle className="text-2xl font-bold">AMAC Revenue</CardTitle>
          <CardDescription className="text-lg">
            Field Collector App
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collectorId">Collector ID</Label>
              <Input
                id="collectorId"
                type="text"
                placeholder="e.g., COL-A-001"
                value={collectorId}
                onChange={(e) => setCollectorId(e.target.value.toUpperCase())}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                autoComplete="current-password"
                maxLength={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !collectorId || !pin}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Status Indicators */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <div className="flex gap-2">
                <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
                <Badge variant={locationEnabled && currentLocation ? "default" : "secondary"} className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {locationEnabled && currentLocation ? 'GPS' : 'No GPS'}
                </Badge>
                <Badge variant={batteryLevel > 20 ? "default" : "destructive"} className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  {batteryLevel}%
                </Badge>
              </div>
            </div>

            {currentLocation && (
              <div className="text-xs text-gray-500 text-center">
                📍 Location: {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>Authorized AMAC Field Collectors Only</p>
            <p className="mt-1">Contact supervisor for login credentials</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
