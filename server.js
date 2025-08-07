const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('JSrobotics unified API is live.');
});

/**
 * Recursively walk through the /api folder and register routes
 * Example: /api/components/create.js → /api/components/create
 */
function registerRoutesFromFolder(baseRoutePath, folderPath) {
  fs.readdirSync(folderPath).forEach((fileOrFolder) => {
    const fullPath = path.join(folderPath, fileOrFolder);
    const routePath = path.join(baseRoutePath, fileOrFolder.replace(/\.js$/, ''));

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      registerRoutesFromFolder(routePath, fullPath); // Recurse into subfolders
    } else if (stat.isFile() && fileOrFolder.endsWith('.js')) {
      try {
        const route = require(fullPath);

        // If it's a dynamic route like [id].js → convert to :id
        const finalRoute = routePath.replace(/\[([^\]]+)\]/g, ':$1').replace(/\\/g, '/');

        app.use(finalRoute, route);
        console.log(`✅ Loaded route: ${finalRoute}`);
      } catch (err) {
        console.error(`❌ Failed to load route ${routePath}:`, err);
      }
    }
  });
}

// Start registering all routes from /api
registerRoutesFromFolder('/api', path.join(__dirname, 'api'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
 