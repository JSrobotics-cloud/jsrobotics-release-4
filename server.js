import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());


// ========== COMPONENTS ==========
import componentsIndex from './api/components/index.js';
import componentsCreate from './api/components/create.js';

app.get('/api/components/index', componentsIndex);
app.post('/api/components/create', componentsCreate);

// ========== COURSES ==========
import coursesIndex from './api/courses/index.js';
import courseById from './api/courses/[id].js';
import coursesCreate from './api/courses/create.js';

app.get('/api/courses/index', coursesIndex);
app.get('/api/courses/:id', courseById);
// Disable body parsing for this route so formidable can read the raw stream
app.post('/api/courses/create', (req, res, next) => {
  // remove any pre-parsed body so formidable works
  req.body = undefined;
  coursesCreate(req, res, next);
});


// ========== PROJECTS ==========
import projectsIndex from './api/projects/index.js';
import projectsCreate from './api/projects/create.js';

app.get('/api/projects/index', projectsIndex);
app.post('/api/projects/create', projectsCreate);

// ========== UPLOAD ==========
import uploadHandler from './api/upload.js';
app.post('/api/upload', uploadHandler);

// ========== HEALTH CHECK ==========
app.get('/check', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


app.use(express.json());