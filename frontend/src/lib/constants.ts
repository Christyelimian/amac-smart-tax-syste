// AMAC Revenue Types - Complete list of 51 revenue categories
export const revenueTypes = [
  { id: "property-tax", name: "Property Tax", category: "Property", baseAmount: 50000, icon: "🏠" },
  { id: "business-premises", name: "Business Premises Permit", category: "Business", baseAmount: 25000, icon: "🏢" },
  { id: "signage-permit", name: "Signage/Billboard Permit", category: "Advertising", baseAmount: 15000, icon: "📋" },
  { id: "hotel-license", name: "Hotel/Guest House License", category: "Hospitality", baseAmount: 100000, icon: "🏨" },
  { id: "restaurant-license", name: "Restaurant License", category: "Hospitality", baseAmount: 35000, icon: "🍽️" },
  { id: "bar-license", name: "Bar & Liquor License", category: "Hospitality", baseAmount: 50000, icon: "🍻" },
  { id: "market-stall", name: "Market Stall Permit", category: "Trade", baseAmount: 12000, icon: "🏪" },
  { id: "hawker-permit", name: "Hawker's Permit", category: "Trade", baseAmount: 5000, icon: "🛒" },
  { id: "motor-park", name: "Motor Park Levy", category: "Transport", baseAmount: 20000, icon: "🚌" },
  { id: "taxi-permit", name: "Taxi Permit", category: "Transport", baseAmount: 8000, icon: "🚕" },
  { id: "tricycle-permit", name: "Tricycle (Keke) Permit", category: "Transport", baseAmount: 6000, icon: "🛺" },
  { id: "motorcycle-permit", name: "Motorcycle (Okada) Permit", category: "Transport", baseAmount: 4000, icon: "🏍️" },
  { id: "development-levy", name: "Development Levy", category: "Construction", baseAmount: 75000, icon: "🏗️" },
  { id: "building-plan", name: "Building Plan Approval", category: "Construction", baseAmount: 50000, icon: "📐" },
  { id: "c-of-o", name: "Certificate of Occupancy", category: "Land", baseAmount: 200000, icon: "📜" },
  { id: "land-use-charge", name: "Land Use Charge", category: "Land", baseAmount: 40000, icon: "🗺️" },
  { id: "waste-disposal", name: "Waste Disposal Fee", category: "Environmental", baseAmount: 10000, icon: "♻️" },
  { id: "environmental-levy", name: "Environmental Impact Levy", category: "Environmental", baseAmount: 30000, icon: "🌿" },
  { id: "water-abstraction", name: "Water Abstraction Fee", category: "Utilities", baseAmount: 15000, icon: "💧" },
  { id: "borehole-permit", name: "Borehole Drilling Permit", category: "Utilities", baseAmount: 25000, icon: "⛏️" },
  { id: "telecom-mast", name: "Telecom Mast Levy", category: "Telecom", baseAmount: 500000, icon: "📡" },
  { id: "bank-license", name: "Bank Branch License", category: "Finance", baseAmount: 150000, icon: "🏦" },
  { id: "microfinance", name: "Microfinance License", category: "Finance", baseAmount: 50000, icon: "💰" },
  { id: "petrol-station", name: "Petrol Station License", category: "Energy", baseAmount: 100000, icon: "⛽" },
  { id: "lpg-station", name: "LPG Station Permit", category: "Energy", baseAmount: 75000, icon: "🔥" },
  { id: "cinema-license", name: "Cinema/Theatre License", category: "Entertainment", baseAmount: 80000, icon: "🎬" },
  { id: "event-center", name: "Event Center License", category: "Entertainment", baseAmount: 60000, icon: "🎉" },
  { id: "nightclub-license", name: "Nightclub License", category: "Entertainment", baseAmount: 100000, icon: "🎵" },
  { id: "gym-license", name: "Gym/Fitness Center License", category: "Health", baseAmount: 25000, icon: "💪" },
  { id: "spa-license", name: "Spa/Wellness Center License", category: "Health", baseAmount: 30000, icon: "🧘" },
  { id: "pharmacy-license", name: "Pharmacy License", category: "Health", baseAmount: 40000, icon: "💊" },
  { id: "hospital-license", name: "Private Hospital License", category: "Health", baseAmount: 150000, icon: "🏥" },
  { id: "school-license", name: "Private School License", category: "Education", baseAmount: 100000, icon: "🎓" },
  { id: "tutorial-center", name: "Tutorial Center License", category: "Education", baseAmount: 20000, icon: "📚" },
  { id: "supermarket-license", name: "Supermarket License", category: "Retail", baseAmount: 45000, icon: "🛍️" },
  { id: "warehouse-permit", name: "Warehouse Permit", category: "Logistics", baseAmount: 35000, icon: "📦" },
  { id: "abattoir-license", name: "Abattoir License", category: "Agriculture", baseAmount: 50000, icon: "🥩" },
  { id: "farm-permit", name: "Commercial Farm Permit", category: "Agriculture", baseAmount: 25000, icon: "🌾" },
  { id: "quarry-license", name: "Quarry/Mining License", category: "Mining", baseAmount: 200000, icon: "⛰️" },
  { id: "sand-dredging", name: "Sand Dredging Permit", category: "Mining", baseAmount: 100000, icon: "🏖️" },
  { id: "factory-license", name: "Factory License", category: "Manufacturing", baseAmount: 120000, icon: "🏭" },
  { id: "workshop-permit", name: "Workshop Permit", category: "Manufacturing", baseAmount: 20000, icon: "🔧" },
  { id: "printing-press", name: "Printing Press License", category: "Manufacturing", baseAmount: 30000, icon: "🖨️" },
  { id: "car-wash", name: "Car Wash Permit", category: "Services", baseAmount: 15000, icon: "🚗" },
  { id: "laundry-license", name: "Laundry/Dry Cleaning License", category: "Services", baseAmount: 12000, icon: "👔" },
  { id: "barbing-salon", name: "Barbing Salon Permit", category: "Services", baseAmount: 8000, icon: "✂️" },
  { id: "beauty-salon", name: "Beauty Salon Permit", category: "Services", baseAmount: 10000, icon: "💄" },
  { id: "photography", name: "Photography Studio License", category: "Services", baseAmount: 15000, icon: "📷" },
  { id: "radio-station", name: "Radio Station License", category: "Media", baseAmount: 500000, icon: "📻" },
  { id: "cable-tv", name: "Cable TV License", category: "Media", baseAmount: 200000, icon: "📺" },
  { id: "outdoor-advert", name: "Outdoor Advertisement Permit", category: "Advertising", baseAmount: 25000, icon: "🎯" },
];

export const zones = [
  { id: "a", name: "Zone A - Central Business District", multiplier: 1.5 },
  { id: "b", name: "Zone B - Maitama/Asokoro", multiplier: 1.3 },
  { id: "c", name: "Zone C - Wuse/Garki", multiplier: 1.2 },
  { id: "d", name: "Zone D - Satellite Towns", multiplier: 1.0 },
] as const;

export const propertyTypes = [
  { id: "business", name: "Business", icon: "🏢" },
  { id: "property", name: "Property", icon: "🏠" },
  { id: "vehicle", name: "Vehicle", icon: "🚗" },
] as const;

export const paymentStatuses = {
  pending: { label: "Pending", color: "warning" },
  confirmed: { label: "Confirmed", color: "success" },
  processing: { label: "Processing", color: "info" },
  failed: { label: "Failed", color: "destructive" },
} as const;

// Format currency in Naira
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Format time
export const formatTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Generate reference number
export const generateReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AMAC-${timestamp}-${random}`;
};
