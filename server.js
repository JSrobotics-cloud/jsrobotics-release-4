import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// ===== CORS Setup =====
const allowedOrigins = [
  'https://jsrobotics-release-4.vercel.app',
  'https://jsrobotics.uz',
  'http://localhost:3000'
];

app.use((req, res, next) => {
  // Always set CORS headers
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Preflight request handling
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// ===== COMPONENTS =====
import componentsIndex from './api/components/index.js';
import componentsCreate from './api/components/create.js';

app.get('/api/components/index', componentsIndex);
app.post('/api/components/create', componentsCreate);

// ===== COURSES =====
import coursesIndex from './api/courses/index.js';
import courseById from './api/courses/[id].js';
import coursesCreate from './api/courses/create.js';

app.get('/api/courses/index', coursesIndex);
app.get('/api/courses/:id', courseById);

// Special handling for formidable
app.post('/api/courses/create', (req, res, next) => {
  req.body = undefined; // ensure formidable gets raw stream
  coursesCreate(req, res, next);
});

// ===== PROJECTS =====
import projectsIndex from './api/projects/index.js';
import projectsCreate from './api/projects/create.js';

app.get('/api/projects/index', projectsIndex);
app.post('/api/projects/create', projectsCreate);

// ===== PRODUCTS =====
import productsIndex from './api/products/index.js';
import productsCreate from './api/products/create.js';

app.get('/api/products/index', productsIndex);
app.post('/api/products/create', productsCreate);

// ===== UPLOAD =====
import uploadHandler from './api/upload.js';
app.post('/api/upload', uploadHandler);

// ===== HEALTH CHECK =====
app.get('/check', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
