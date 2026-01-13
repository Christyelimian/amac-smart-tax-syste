import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../lib/mongodb.js';

const JWT_SECRET = 'amac-admin-secret-key-2024';
const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: ['http://localhost:3003', 'https://amac-admin-portal.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { db } = await connectToDatabase();
    const admin = await db.collection('admins').findOne({ email });

    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    // Update last login
    await db.collection('admins').updateOne(
      { _id: admin._id },
      { $set: { last_login: new Date() } }
    );

    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role,
        permissions: admin.permissions 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all payments
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { page = 1, limit = 50, status, gateway, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const filter: any = {};

    if (status) filter.status = status;
    if (gateway) filter.gateway = gateway;
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { receipt_number: { $regex: search, $options: 'i' } },
        { payer_name: { $regex: search, $options: 'i' } },
        { payer_email: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await db.collection('payments')
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await db.collection('payments').countDocuments(filter);

    res.json({
      success: true,
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment details
app.get('/api/payments/:reference', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const payment = await db.collection('payments').findOne({ 
      reference: req.params.reference 
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ success: true, payment });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Create/update payment (webhook)
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { db } = await connectToDatabase();
    
    // Update existing payment or create new
    await db.collection('payments').updateOne(
      { reference: paymentData.reference },
      { 
        $set: paymentData,
        $setOnInsert: paymentData
      },
      { upsert: true }
    );

    // If payment is confirmed, create receipt
    if (paymentData.status === 'confirmed' && paymentData.receipt_number) {
      const receiptData = {
        receipt_number: paymentData.receipt_number,
        payment_id: paymentData.reference,
        reference: paymentData.reference,
        amount: paymentData.amount,
        payer_name: paymentData.payer_name,
        service_name: paymentData.service_name,
        qr_code_data: `receipt:${paymentData.receipt_number}`,
        sent_via_email: false,
        sent_via_sms: false,
        generated_at: new Date(),
        created_at: new Date()
      };

      await db.collection('receipts').updateOne(
        { receipt_number: paymentData.receipt_number },
        { 
          $set: receiptData,
          $setOnInsert: receiptData
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Payment recorded' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Get analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const { period = '7d' } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case '24h':
        dateFilter = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    // Total revenue
    const totalRevenue = await db.collection('payments')
      .aggregate([
        { $match: { paid_at: dateFilter, status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
      .toArray();

    // Payment count
    const paymentCount = await db.collection('payments')
      .countDocuments({ paid_at: dateFilter, status: 'confirmed' });

    // Revenue by gateway
    const revenueByGateway = await db.collection('payments')
      .aggregate([
        { $match: { paid_at: dateFilter, status: 'confirmed' } },
        { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
      .toArray();

    // Recent payments
    const recentPayments = await db.collection('payments')
      .find({ status: 'confirmed' })
      .sort({ paid_at: -1 })
      .limit(10)
      .toArray();

    res.json({
      success: true,
      analytics: {
        totalRevenue: totalRevenue[0]?.total || 0,
        paymentCount,
        revenueByGateway,
        recentPayments,
        period
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get receipt verification
app.get('/api/receipts/:receiptNumber', authenticateToken, async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const receipt = await db.collection('receipts').findOne({ 
      receipt_number: req.params.receiptNumber 
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json({ success: true, receipt });

  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Health check
app.get('/api/health', (_req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0' 
  });
});

app.listen(PORT, () => {
  console.log(`Admin Portal API running on port ${PORT}`);
});