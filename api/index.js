const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Load all API handlers from the handlers subfolder
const handlersPath = path.join(__dirname, 'handlers');
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

// Export for Vercel serverless function
module.exports = app;
