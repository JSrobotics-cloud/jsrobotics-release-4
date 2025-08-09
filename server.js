import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ========== COMPONENTS ==========
import componentsIndex from './api/components/index.js';
import componentsCreate from './api/components/create.js';

app.get('/api/components', componentsIndex);
app.post('/api/components', componentsCreate);

// ========== COURSES ==========
import coursesIndex from './api/courses/index.js';
import courseById from './api/courses/[id].js';
import coursesCreate from './api/courses/create.js';

app.get('/api/courses', coursesIndex);
app.get('/api/courses/:id', courseById);
app.post('/api/courses', coursesCreate);

// ========== PROJECTS ==========
import projectsIndex from './api/projects/index.js';
import projectsCreate from './api/projects/create.js';

app.get('/api/projects', projectsIndex);
app.post('/api/projects', projectsCreate);

// ========== UPLOAD ==========
import uploadHandler from './api/upload.js';
app.post('/api/upload', uploadHandler);

// ========== HEALTH CHECK ==========
app.get('/check', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});

// Optional: serve frontend if present
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
