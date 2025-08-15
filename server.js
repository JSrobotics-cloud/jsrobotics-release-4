// server.js — Safe boot version for Fly.io
import express from 'express';
import cors from 'cors';

const app = express();

// ====== CONFIG ======
const allowedOrigins = [
  'https://jsrobotics-release-4.vercel.app',
  'https://jsrobotics.uz',
  'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed by server'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== HELPER to load routes safely ======
function safeRoute(method, path, importPath) {
  app[method](path, async (req, res, next) => {
    try {
      const mod = await import(importPath);
      return mod.default(req, res, next);
    } catch (err) {
      console.error(`❌ Error loading route ${path}:`, err);
      res.status(500).json({ error: `Server error in ${path}` });
    }
  });
}

// ====== ROUTES ======

// Components
safeRoute('get', '/api/components/index', './api/components/index.js');
safeRoute('post', '/api/components/create', './api/components/create.js');

// Courses
safeRoute('get', '/api/courses/index', './api/courses/index.js');
safeRoute('get', '/api/courses/:id', './api/courses/[id].js');
safeRoute('post', '/api/courses/create', './api/courses/create.js');

// Projects
safeRoute('get', '/api/projects/index', './api/projects/index.js');
safeRoute('post', '/api/projects/create', './api/projects/create.js');

// Products
safeRoute('get', '/api/products/index', './api/products/index.js');
safeRoute('post', '/api/products/create', './api/products/create.js');

// Visibility
safeRoute('patch', '/api/updateVisibility', './api/updateVisibility.js');

// Upload
safeRoute('post', '/api/upload', './api/upload.js');

// Health check
app.get('/check', (req, res) => res.json({ status: 'ok' }));

// Root
app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});

// ====== GLOBAL ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ====== START SERVER ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
