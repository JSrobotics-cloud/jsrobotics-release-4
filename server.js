// server.js — CORS-first, routes after middleware
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// Allowed origins - keep the ones you trust
const allowedOrigins = [
  'https://jsrobotics-release-4.vercel.app',
  'https://jsrobotics.uz',
  'http://localhost:3000'
];

// CORS config that reflects the incoming Origin (recommended for admin UI)
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed by server'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept'],
  credentials: true,
  preflightContinue: false, // important - let cors handle OPTIONS
  optionsSuccessStatus: 204
};

// APPLY CORS BEFORE ANY ROUTES
app.use(cors(corsOptions));

// Also explicitly handle preflight for all routes (safe)
app.options('*', cors(corsOptions));

// Now body parsers (after CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




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

// Visibility

import updateVisibilityHandler from './api/updateVisibility.js';
app.patch('/api/updateVisibility', updateVisibilityHandler);


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
