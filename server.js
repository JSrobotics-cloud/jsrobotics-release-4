import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ===== Initialize App =====
const app = express();
app.use(express.json());

// ===== Allowed Origins =====
const allowedOrigins = [
  'https://jsrobotics-release-4.vercel.app',
  'https://jsrobotics.uz',
  'http://localhost:3000' // for local testing
];

// ===== CORS Middleware =====
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // Preflight OK
  }
  next();
});

// ===== ROUTES =====

// Components
import componentsIndex from './api/components/index.js';
import componentsCreate from './api/components/create.js';
app.get('/api/components/index', componentsIndex);
app.post('/api/components/create', componentsCreate);

// Courses
import coursesIndex from './api/courses/index.js';
import courseById from './api/courses/[id].js';
import coursesCreate from './api/courses/create.js';
app.get('/api/courses/index', coursesIndex);
app.get('/api/courses/:id', courseById);
app.post('/api/courses/create', (req, res, next) => {
  req.body = undefined; // Let formidable handle body
  coursesCreate(req, res, next);
});

// Projects
import projectsIndex from './api/projects/index.js';
import projectsCreate from './api/projects/create.js';
app.get('/api/projects/index', projectsIndex);
app.post('/api/projects/create', projectsCreate);

// Products
import productsIndex from './api/products/index.js';
import productsCreate from './api/products/create.js';
app.get('/api/products/index', productsIndex);
app.post('/api/products/create', productsCreate);

// Upload
import uploadHandler from './api/upload.js';
app.post('/api/upload', uploadHandler);

// Health check
app.get('/check', (req, res) => res.json({ status: 'ok' }));

// Root
app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
