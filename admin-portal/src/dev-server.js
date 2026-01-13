import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Simple API proxy
app.use('/api/*', (req, res, next) => {
  console.log(`Proxying API request to backend: ${req.method} ${req.path}`);
  
  const backendUrl = 'http://localhost:3004';
  const targetUrl = `${backendUrl}${req.originalUrl.replace('/api', '')}`;
  
  fetch(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'GET' ? undefined : JSON.stringify(req.body),
  })
  .then(response => {
    // Copy headers
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Send response
    res.status(response.status);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      response.json().then(data => res.json(data));
    } else {
      response.text().then(text => res.send(text));
    }
  })
  .catch(error => {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Backend server error' });
  });
  
  if (next) next();
});

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AMAC Admin Portal running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-portal/login`);
  console.log(`🔌 API Backend: http://localhost:${PORT}/api/*`);
  console.log(`🧪 Static Files: ${join(__dirname, 'dist')}`);
});