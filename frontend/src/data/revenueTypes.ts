export interface RevenueType {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  baseAmount?: number;
  zones?: { zone: string; amount: number }[];
  popular?: boolean;
}

export const categories = [
  { id: 'all', name: 'All Services', icon: '📋' },
  { id: 'property', name: 'Property', icon: '🏠' },
  { id: 'business', name: 'Business', icon: '🏪' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'financial', name: 'Financial', icon: '💳' },
  { id: 'markets', name: 'Markets', icon: '🏪' },
  { id: 'health', name: 'Health & Sanitation', icon: '🦟' },
  { id: 'media', name: 'Media & Advertising', icon: '📺' },
  { id: 'construction', name: 'Construction', icon: '🏗️' },
  { id: 'admin', name: 'Administrative', icon: '🏛️' },
  { id: 'agricultural', name: 'Agricultural', icon: '🌾' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'location', name: 'Location-Specific', icon: '📍' },
  { id: 'arrears', name: 'Arrears & Recovery', icon: '💰' },
];

export const revenueTypes: RevenueType[] = [
  // Property Related
  {
    id: 'tenement-rate',
    name: 'Tenement Rate',
    description: 'Annual property tax based on property value',
    category: 'property',
    icon: '🏠',
    baseAmount: 50000,
    popular: true,
  },
  {
    id: 'ground-rent',
    name: 'Ground Rent',
    description: 'Annual ground rent for leased properties',
    category: 'property',
    icon: '🏠',
    baseAmount: 35000,
  },
  {
    id: 'fitness-habitation',
    name: 'Fitness for Habitation Certificate',
    description: 'Health & safety compliance certificate',
    category: 'property',
    icon: '📋',
    baseAmount: 25000,
  },

  // Business Licenses
  {
    id: 'shop-kiosk-a',
    name: 'Shop & Kiosk License - Zone A',
    description: 'License for shops/kiosks in Zone A (Maitama, Asokoro, Wuse)',
    category: 'business',
    icon: '🏪',
    baseAmount: 75000,
    popular: true,
  },
  {
    id: 'shop-kiosk-b',
    name: 'Shop & Kiosk License - Zone B',
    description: 'License for shops/kiosks in Zone B (Garki, Gwarinpa, Kubwa)',
    category: 'business',
    icon: '🏪',
    baseAmount: 45000,
  },
  {
    id: 'shop-kiosk-c',
    name: 'Shop & Kiosk License - Zone C',
    description: 'License for shops/kiosks in Zone C (Nyanya, Karu, Lugbe)',
    category: 'business',
    icon: '🏪',
    baseAmount: 25000,
  },
  {
    id: 'hotel-license',
    name: 'Hotel License',
    description: 'Annual license for hotels and guest houses',
    category: 'business',
    icon: '🏨',
    baseAmount: 180000,
    popular: true,
  },
  {
    id: 'restaurant-license',
    name: 'Restaurant/Eatery License',
    description: 'License for food service establishments',
    category: 'business',
    icon: '🍽️',
    baseAmount: 50000,
  },
  {
    id: 'bank-license',
    name: 'Bank License',
    description: 'Annual license for banking institutions',
    category: 'business',
    icon: '🏦',
    baseAmount: 500000,
  },
  {
    id: 'filling-station',
    name: 'Filling Station Permit',
    description: 'License for petrol/gas stations',
    category: 'business',
    icon: '⛽',
    baseAmount: 250000,
  },

  // Transport & Vehicles
  {
    id: 'motorcycle-a',
    name: 'Motorcycle Permit - Zone A',
    description: 'Commercial motorcycle operator permit in Zone A',
    category: 'transport',
    icon: '🛵',
    baseAmount: 15000,
    popular: true,
  },
  {
    id: 'motorcycle-c',
    name: 'Motorcycle Permit - Zone C',
    description: 'Commercial motorcycle operator permit in Zone C',
    category: 'transport',
    icon: '🛵',
    baseAmount: 8000,
  },
  {
    id: 'keke-napep-c',
    name: 'Keke NAPEP Zone C',
    description: 'Commercial tricycle operator permit',
    category: 'transport',
    icon: '🛺',
    baseAmount: 12000,
  },
  {
    id: 'tricycle-a',
    name: 'Commercial Tricycle Zone A',
    description: 'Commercial tricycle operator permit',
    category: 'transport',
    icon: '🛺',
    baseAmount: 25000,
  },
  {
    id: 'uber-bolt-rida',
    name: 'Uber/Bolt/Rida License',
    description: 'Ride-hailing service operator license',
    category: 'transport',
    icon: '🚗',
    baseAmount: 20000,
  },
  {
    id: 'corporate-parking',
    name: 'Corporate Parking',
    description: 'Corporate parking space levy',
    category: 'transport',
    icon: '🅿️',
    baseAmount: 100000,
  },

  // Financial Services
  {
    id: 'pos-license-a',
    name: 'POS License - Zone A',
    description: 'License for POS operators in Zone A',
    category: 'financial',
    icon: '💳',
    baseAmount: 30000,
    popular: true,
  },
  {
    id: 'pos-license-b',
    name: 'POS License - Zone B',
    description: 'License for POS operators in Zone B',
    category: 'financial',
    icon: '💳',
    baseAmount: 20000,
  },
  {
    id: 'pos-license-c',
    name: 'POS License - Zone C',
    description: 'License for POS operators in Zone C',
    category: 'financial',
    icon: '💳',
    baseAmount: 10000,
  },

  // Markets
  {
    id: 'karu-market',
    name: 'Karu Market Levy',
    description: 'Market stall/shop levy for Karu Market',
    category: 'markets',
    icon: '🏪',
    baseAmount: 15000,
  },
  {
    id: 'gosa-market',
    name: 'Gosa Market Levy',
    description: 'Market stall/shop levy for Gosa Market',
    category: 'markets',
    icon: '🏪',
    baseAmount: 12000,
  },
  {
    id: 'karmo-market',
    name: 'Karmo Market Levy',
    description: 'Market stall/shop levy for Karmo Market',
    category: 'markets',
    icon: '🏪',
    baseAmount: 12000,
  },
  {
    id: 'utako-market',
    name: 'Utako Market Ground Rent',
    description: 'Market ground rent & waste management',
    category: 'markets',
    icon: '🏪',
    baseAmount: 25000,
  },
  {
    id: 'gwagwa-market',
    name: 'Gwagwa Market Levy',
    description: 'Market stall/shop levy for Gwagwa Market',
    category: 'markets',
    icon: '🏪',
    baseAmount: 10000,
  },

  // Health & Sanitation
  {
    id: 'fumigation',
    name: 'Fumigation Service',
    description: 'Fumigation & pest control service',
    category: 'health',
    icon: '🦟',
    baseAmount: 30000,
    popular: true,
  },
  {
    id: 'waste-management',
    name: 'Waste Management & Control',
    description: 'Waste collection & management levy',
    category: 'health',
    icon: '🗑️',
    baseAmount: 20000,
  },
  {
    id: 'waste-evacuation',
    name: 'Waste Evacuation',
    description: 'Special waste removal service',
    category: 'health',
    icon: '🚛',
    baseAmount: 45000,
  },
  {
    id: 'solid-waste',
    name: 'Solid Waste Management',
    description: 'Solid waste collection levy',
    category: 'health',
    icon: '♻️',
    baseAmount: 25000,
  },
  {
    id: 'public-toilet',
    name: 'Public Toilet Fee',
    description: 'Public toilet maintenance levy',
    category: 'health',
    icon: '🚻',
    baseAmount: 5000,
  },
  {
    id: 'food-handling',
    name: 'Food Handling Certificate',
    description: 'Health certificate for food handlers',
    category: 'health',
    icon: '📋',
    baseAmount: 8000,
  },
  {
    id: 'hazardous-disposal',
    name: 'Hazardous/Bio-Hazardous Disposal',
    description: 'Medical/hazardous waste disposal',
    category: 'health',
    icon: '☣️',
    baseAmount: 75000,
  },

  // Media & Advertising
  {
    id: 'radio-tv-a',
    name: 'Radio/TV License - Zone A',
    description: 'Broadcasting equipment license in Zone A',
    category: 'media',
    icon: '📺',
    baseAmount: 150000,
  },
  {
    id: 'radio-tv-bc',
    name: 'Radio/TV License - Zones B & C',
    description: 'Broadcasting equipment license in Zones B & C',
    category: 'media',
    icon: '📺',
    baseAmount: 80000,
  },
  {
    id: 'signpost-billboard',
    name: 'Signpost/Billboard',
    description: 'Outdoor advertising permit',
    category: 'media',
    icon: '🪧',
    baseAmount: 100000,
  },
  {
    id: 'mobile-advertisement',
    name: 'Mobile Advertisement',
    description: 'Mobile advertising permit',
    category: 'media',
    icon: '🚐',
    baseAmount: 50000,
  },

  // Construction & Materials
  {
    id: 'building-materials',
    name: 'Building Materials/Construction',
    description: 'Construction materials levy',
    category: 'construction',
    icon: '🧱',
    baseAmount: 35000,
  },
  {
    id: 'quarry-sand',
    name: 'Quarry/Sand Dredging',
    description: 'Mining & quarrying permit',
    category: 'construction',
    icon: '⛏️',
    baseAmount: 200000,
  },

  // Administrative
  {
    id: 'street-naming',
    name: 'Street Naming/House Numbering',
    description: 'Property addressing service',
    category: 'admin',
    icon: '🏘️',
    baseAmount: 15000,
  },
  {
    id: 'operational-permit',
    name: 'Operational Permit on Business Premises',
    description: 'General business operating license',
    category: 'admin',
    icon: '📋',
    baseAmount: 40000,
  },
  {
    id: 'warehouse-storage',
    name: 'Warehouse Storage',
    description: 'Warehouse/storage facility permit',
    category: 'admin',
    icon: '🏭',
    baseAmount: 80000,
  },
  {
    id: 'daily-ticketing',
    name: 'Daily Ticketing',
    description: 'Daily business operation ticket',
    category: 'admin',
    icon: '🎫',
    baseAmount: 500,
  },
  {
    id: 'csr',
    name: 'Corporate Social Responsibility',
    description: 'CSR contribution',
    category: 'admin',
    icon: '🤝',
    baseAmount: 100000,
  },

  // Agricultural & Trade
  {
    id: 'agricultural-produce',
    name: 'Agricultural Produce',
    description: 'Agricultural produce trade levy',
    category: 'agricultural',
    icon: '🌾',
    baseAmount: 20000,
  },
  {
    id: 'furniture-business',
    name: 'Furniture Business',
    description: 'Furniture trade/manufacturing license',
    category: 'agricultural',
    icon: '🪑',
    baseAmount: 35000,
  },

  // Entertainment
  {
    id: 'merriment-entertainment',
    name: 'Merriment & Entertainment',
    description: 'Entertainment venue/event license',
    category: 'entertainment',
    icon: '🎭',
    baseAmount: 50000,
  },

  // Location-Specific
  {
    id: 'fha-lugbe',
    name: 'FHA Lugbe',
    description: 'FHA Lugbe estate-specific levy',
    category: 'location',
    icon: '📍',
    baseAmount: 30000,
  },

  // Arrears & Recovery
  {
    id: 'arrears-revenue',
    name: 'Arrears of Revenue',
    description: 'Outstanding payment from previous years',
    category: 'arrears',
    icon: '💰',
  },
  {
    id: 'recovery-bank-charges',
    name: 'Recovery of Excess Bank Charges',
    description: 'Bank charge recovery',
    category: 'arrears',
    icon: '🏦',
  },
];

export const popularServices = revenueTypes.filter(r => r.popular);
