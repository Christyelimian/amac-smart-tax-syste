import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { OfflinePayment } from '@/types';

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  syncInProgress: boolean;
  addOfflinePayment: (payment: OfflinePayment) => Promise<void>;
  syncData: () => Promise<void>;
  clearSyncedData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// IndexedDB helper functions
const DB_NAME = 'amac_collector_db';
const DB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create offline payments store
      if (!db.objectStoreNames.contains('offline_payments')) {
        const store = db.createObjectStore('offline_payments', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create local settings store
      if (!db.objectStoreNames.contains('local_settings')) {
        db.createObjectStore('local_settings', { keyPath: 'key' });
      }
    };
  });
};

const getOfflinePayments = async (): Promise<OfflinePayment[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_payments'], 'readonly');
    const store = transaction.objectStore('offline_payments');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

const saveOfflinePayment = async (payment: OfflinePayment): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_payments'], 'readwrite');
    const store = transaction.objectStore('offline_payments');
    const request = store.put(payment);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const deleteOfflinePayment = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_payments'], 'readwrite');
    const store = transaction.objectStore('offline_payments');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const clearSyncedPayments = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_payments'], 'readwrite');
    const store = transaction.objectStore('offline_payments');
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(false));

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
};

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing data...');
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now offline - collections will be saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync count on mount
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const payments = await getOfflinePayments();
        const pending = payments.filter(p => !p.synced).length;
        setPendingSyncCount(pending);
      } catch (error) {
        console.error('Failed to load pending sync count:', error);
      }
    };

    loadPendingCount();
  }, []);

  const addOfflinePayment = useCallback(async (payment: OfflinePayment) => {
    try {
      await saveOfflinePayment(payment);
      setPendingSyncCount(prev => prev + 1);
      toast.success('Payment saved offline - will sync when online');
    } catch (error) {
      console.error('Failed to save offline payment:', error);
      toast.error('Failed to save payment offline');
    }
  }, []);

  const syncData = useCallback(async () => {
    if (!isOnline || syncInProgress) return;

    try {
      setSyncInProgress(true);
      const payments = await getOfflinePayments();
      const unsyncedPayments = payments.filter(p => !p.synced);

      if (unsyncedPayments.length === 0) {
        return;
      }

      toast.info(`Syncing ${unsyncedPayments.length} payments...`);

      // Import supabase dynamically to avoid circular imports
      const { supabase } = await import('@/lib/supabase');

      let syncedCount = 0;
      for (const payment of unsyncedPayments) {
        try {
          // Attempt to sync payment to server
          const { data, error } = await supabase
            .from('payments')
            .insert({
              ...payment.data,
              collection_timestamp: payment.timestamp,
              sync_timestamp: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;

          // Mark as synced
          payment.synced = true;
          payment.sync_attempts += 1;
          await saveOfflinePayment(payment);

          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync payment ${payment.id}:`, error);
          payment.sync_attempts += 1;
          payment.last_sync_attempt = new Date().toISOString();
          payment.error = error instanceof Error ? error.message : 'Unknown error';
          await saveOfflinePayment(payment);
        }
      }

      setPendingSyncCount(prev => Math.max(0, prev - syncedCount));

      if (syncedCount > 0) {
        toast.success(`Successfully synced ${syncedCount} payments`);
      }

      if (unsyncedPayments.length > syncedCount) {
        toast.warning(`${unsyncedPayments.length - syncedCount} payments failed to sync - will retry later`);
      }

    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, syncInProgress]);

  const clearSyncedData = useCallback(async () => {
    try {
      await clearSyncedPayments();
      setPendingSyncCount(0);
      toast.success('Synced data cleared');
    } catch (error) {
      console.error('Failed to clear synced data:', error);
      toast.error('Failed to clear synced data');
    }
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !syncInProgress) {
      const timer = setTimeout(() => {
        syncData();
      }, 2000); // Wait 2 seconds after coming online

      return () => clearTimeout(timer);
    }
  }, [isOnline, syncInProgress, syncData]);

  const value: OfflineContextType = {
    isOnline,
    pendingSyncCount,
    syncInProgress,
    addOfflinePayment,
    syncData,
    clearSyncedData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
