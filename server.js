const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default home route
app.get('/', (req, res) => {
  res.send('JSrobotics API running');
});

// Load all routes from the /api folder recursively
function loadRoutes(basePath, dir) {
  fs.readdirSync(dir).forEach((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadRoutes(path.join(basePath, entry), fullPath);
    } else if (entry.endsWith('.js')) {
      const route = require(fullPath);
      const routePath = path.join(basePath, entry.replace(/\.js$/, '')).replace(/\\/g, '/');
      const finalRoute = routePath.replace(/\[([^\]]+)\]/g, ':$1');
      app.use(finalRoute, route);
    }
  });
}

// Register routes
loadRoutes('/api', path.join(__dirname, 'api'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
