import { useOffline } from '@/contexts/OfflineContext';
import { useLocation } from '@/contexts/LocationContext';
import { Badge } from './badge';
import { Wifi, WifiOff, MapPin, Battery } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOffline();
  const { locationEnabled, currentLocation } = useLocation();

  // Mock battery level (in a real app, you'd use the Battery API)
  const batteryLevel = 85; // This would come from navigator.getBattery()

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
      {/* Network Status */}
      <Badge
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1 px-2 py-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span className="text-xs">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </Badge>

      {/* Location Status */}
      <Badge
        variant={locationEnabled && currentLocation ? "default" : "secondary"}
        className="flex items-center gap-1 px-2 py-1"
      >
        <MapPin className="h-3 w-3" />
        <span className="text-xs">
          {locationEnabled && currentLocation ? 'GPS' : 'No GPS'}
        </span>
      </Badge>

      {/* Battery Status */}
      <Badge
        variant={batteryLevel > 20 ? "default" : "destructive"}
        className="flex items-center gap-1 px-2 py-1"
      >
        <Battery className="h-3 w-3" />
        <span className="text-xs">{batteryLevel}%</span>
      </Badge>

      {/* Pending Sync Count */}
      {pendingSyncCount > 0 && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 border-orange-300"
        >
          <span className="text-xs">
            {pendingSyncCount} pending
          </span>
        </Badge>
      )}
    </div>
  );
}
