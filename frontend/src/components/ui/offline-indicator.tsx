import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "You're connected to the internet again.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're Offline",
        description: "Some features may be limited. Changes will sync when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection and set last sync time
    const storedSyncTime = localStorage.getItem('last-sync-time');
    if (storedSyncTime) {
      setLastSyncTime(new Date(storedSyncTime));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const handleSync = async () => {
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const now = new Date();
      setLastSyncTime(now);
      localStorage.setItem('last-sync-time', now.toISOString());

      toast({
        title: "Sync Complete",
        description: "Your data has been synchronized successfully.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Don't show anything if online and recently synced
  if (isOnline && !isSyncing && lastSyncTime) {
    const timeSinceSync = Date.now() - lastSyncTime.getTime();
    if (timeSinceSync < 5 * 60 * 1000) { // Less than 5 minutes
      return null;
    }
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <Alert className={`w-auto max-w-sm shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}

          <AlertDescription className="flex items-center gap-2">
            <span className="font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>

            {isOnline && lastSyncTime && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced {formatLastSync(lastSyncTime)}
              </Badge>
            )}

            {isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-6 px-2 text-xs hover:bg-green-100"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
