const express = require('express');
const { createServer } = require('http');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve API routes from the handlers folder
const handlersPath = path.join(__dirname, 'handlers');

// Dynamically load all API endpoints using require (CommonJS)
const handlerFiles = fs.readdirSync(handlersPath);
for (const file of handlerFiles) {
  if (file.endsWith('.js') && !file.startsWith('_')) {
    const route = `/${file.replace('.js', '')}`;
    const handlerPath = path.join(handlersPath, file);
    try {
      const handler = require(handlerPath);
      app.use(`/api${route}`, handler);
    } catch (err) {
      console.error(`Failed to load API endpoint ${file}:`, err);
    }
  }
}

// Serve static files from dist in production, or proxy to Vite in development
if (dev) {
  // In development, proxy to Vite dev server
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
  }));
} else {
  // In production, serve static files
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
  if (dev) {
    console.log(`Frontend proxied to Vite dev server at http://localhost:5173`);
  }
});
