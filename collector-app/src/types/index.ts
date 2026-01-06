// Collector Types
export interface Collector {
  id: string;
  collector_id: string;
  user_id: string;
  full_name: string;
  phone: string;
  zone: string;
  role: 'field_officer' | 'supervisor' | 'coordinator' | 'market_inspector';
  daily_target: number;
  commission_rate: number;
  status: 'active' | 'suspended' | 'inactive';
  supervisor_id?: string;
  device_id?: string;
  last_location?: {
    latitude: number;
    longitude: number;
  };
  last_location_updated?: string;
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface Payment {
  id: string;
  reference: string;
  rrr?: string;
  revenue_type: string;
  service_name: string;
  zone?: string;
  amount: number;
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  business_address?: string;
  registration_number?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'pending_verification' | 'awaiting_verification' | 'rejected';
  payment_method?: string;
  gateway_response?: any;
  receipt_number?: string;
  notes?: string;
  created_at: string;
  confirmed_at?: string;
  updated_at: string;

  // Field collection additions
  collected_by?: string;
  collection_method?: 'online' | 'field_cash' | 'field_pos' | 'partner_bank' | 'partner_pos' | 'partner_transfer';
  gps_location?: {
    latitude: number;
    longitude: number;
  };
  collector_commission?: number;
  collection_device?: string;
  collection_timestamp?: string;
  sync_timestamp?: string;
  offline_reference?: string;
}

// Revenue Types
export interface RevenueType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  base_amount?: number;
  has_zones: boolean;
  is_recurring: boolean;
  renewal_period?: number;
  virtual_account?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Collection Log Types
export interface CollectionLog {
  id: string;
  collector_id: string;
  collection_date: string;
  zone: string;
  total_collections: number;
  total_amount: number;
  cash_collections: number;
  cash_amount: number;
  pos_collections: number;
  pos_amount: number;
  locations_visited: string[];
  start_time?: string;
  end_time?: string;
  notes?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

// Offline Queue Types
export interface OfflinePayment {
  id: string;
  data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
  timestamp: string;
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: string;
  error?: string;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

// Settings Types
export interface CollectorSettings {
  notifications_enabled: boolean;
  gps_tracking_enabled: boolean;
  offline_mode_enabled: boolean;
  auto_sync_enabled: boolean;
  receipt_printing_enabled: boolean;
  camera_enabled: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface PaymentFormData {
  payer_name: string;
  payer_phone: string;
  payer_email?: string;
  revenue_type_code: string;
  zone?: string;
  amount: number;
  business_address?: string;
  registration_number?: string;
  payment_method: 'cash' | 'pos';
  notes?: string;
  business_photo?: File;
}

// Dashboard Stats
export interface DashboardStats {
  today_collections: number;
  today_amount: number;
  target_achieved: number;
  pending_sync: number;
  battery_level?: number;
  gps_status: 'available' | 'unavailable' | 'disabled';
  network_status: 'online' | 'offline';
}
