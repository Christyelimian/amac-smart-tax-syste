import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = "mongodb+srv://Vercel-Admin-amac-portal:7RgEZUPY3lVKn5g4@amac-portal.tegr73k.mongodb.net/?retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('amac-portal');
    
    cachedClient = client;
    cachedDb = db;

    console.log('Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Collections
export const collections = {
  payments: async () => {
    const { db } = await connectToDatabase();
    return db.collection('payments');
  },
  receipts: async () => {
    const { db } = await connectToDatabase();
    return db.collection('receipts');
  },
  users: async () => {
    const { db } = await connectToDatabase();
    return db.collection('users');
  },
  admins: async () => {
    const { db } = await connectToDatabase();
    return db.collection('admins');
  },
  revenueTypes: async () => {
    const { db } = await connectToDatabase();
    return db.collection('revenueTypes');
  },
  analytics: async () => {
    const { db } = await connectToDatabase();
    return db.collection('analytics');
  }
};

// Database schemas
export const schemas = {
  payment: {
    reference: String,
    amount: Number,
    payer_name: String,
    payer_email: String,
    payer_phone: String,
    service_name: String,
    revenue_type_code: String,
    payment_method: String,
    status: String,
    paid_at: Date,
    confirmed_at: Date,
    receipt_number: String,
    gateway: String,
    rrr: String,
    created_at: Date,
    updated_at: Date
  },
  receipt: {
    receipt_number: String,
    payment_id: String,
    reference: String,
    amount: Number,
    payer_name: String,
    service_name: String,
    qr_code_data: String,
    sent_via_email: Boolean,
    sent_via_sms: Boolean,
    email_sent_at: Date,
    sms_sent_at: Date,
    generated_at: Date,
    created_at: Date
  },
  admin: {
    email: String,
    password: String,
    name: String,
    role: String,
    permissions: [String],
    last_login: Date,
    is_active: Boolean,
    created_at: Date,
    updated_at: Date
  },
  user: {
    name: String,
    email: String,
    phone: String,
    properties: [String],
    businesses: [String],
    created_at: Date,
    updated_at: Date
  }
};