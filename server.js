/**
 * StreamLify Local Dev & Production Express Server Runner
 * Author: Hidz
 * Enables instant local preview of Vercel routes in AI Studio
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import search and stream handlers from the api folder
import searchHandler from './api/search.js';
import streamHandler from './api/stream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Resolve static public path
const publicPath = path.join(__dirname, 'public');

// CORS support middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 1. Core API Endpoints
app.get('/api/search', async (req, res) => {
  try {
    await searchHandler(req, res);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

app.get('/api/stream', async (req, res) => {
  try {
    await streamHandler(req, res);
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
});

// 2. Friendly Vercel Route Compatibility Mappings
// Removed so that /search/:q and /stream/:title can serve the Single Page App (index.html)

// 3. Static Client File Server
app.use(express.static(publicPath));

// 4. Client SPA Routing Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Boot the listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 StreamLify Server is active on port ${PORT}!`);
  console.log(`🔗 Local Link: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
