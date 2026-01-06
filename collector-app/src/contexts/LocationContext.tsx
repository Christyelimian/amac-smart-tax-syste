import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LocationData } from '@/types';
import { toast } from 'sonner';

interface LocationContextType {
  currentLocation: LocationData | null;
  locationEnabled: boolean;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  watchId: number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is supported and enabled
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationEnabled(true);
    } else {
      setLocationEnabled(false);
      toast.error('Geolocation is not supported by this browser');
    }
  }, []);

  const getCurrentLocation = useCallback((): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!locationEnabled) {
        toast.error('Location services are not available');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Failed to get location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          toast.error(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, [locationEnabled]);

  const startTracking = useCallback(async () => {
    if (!locationEnabled) {
      toast.error('Location services are not available');
      return;
    }

    try {
      setIsTracking(true);

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setCurrentLocation(location);

          // Optionally reverse geocode for address
          reverseGeocode(location.latitude, location.longitude)
            .then(address => {
              if (address) {
                setCurrentLocation(prev => prev ? { ...prev, address } : null);
              }
            })
            .catch(console.error);
        },
        (error) => {
          console.error('Geolocation watch error:', error);
          toast.error('Failed to track location');
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );

      setWatchId(id);
      toast.success('Location tracking started');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      toast.error('Failed to start location tracking');
      setIsTracking(false);
    }
  }, [locationEnabled]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    toast.success('Location tracking stopped');
  }, [watchId]);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
      // Using a free geocoding service (you might want to use a paid service for production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.city || data.locality || `${data.countryName}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Get initial location on mount
  useEffect(() => {
    if (locationEnabled) {
      getCurrentLocation();
    }
  }, [locationEnabled, getCurrentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const value: LocationContextType = {
    currentLocation,
    locationEnabled,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
    watchId,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
