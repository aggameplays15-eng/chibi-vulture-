const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Load all API handlers from the api folder
const apiPath = path.join(__dirname);
const apiFiles = fs.readdirSync(apiPath);

for (const file of apiFiles) {
  if (file.endsWith('.js') && !file.startsWith('_') && file !== 'index.js') {
    const route = `/${file.replace('.js', '')}`;
    const handlerPath = path.join(apiPath, file);
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
