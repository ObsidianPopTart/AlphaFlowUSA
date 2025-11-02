/*
 * =================================================================
 * || ALPHAFLOW ENGINE - REAL-TIME DATA SERVER ||
 * =================================================================
 *
 * This is the persistent backend "engine" you asked for.
 * It replaces all your Netlify serverless functions.
 *
 * It does two things:
 * 1. Polls the FMP and CoinMarketCap APIs on a timer (server-side).
 * 2. Runs a WebSocket server to PUSH data to all connected clients
 * (your index.html) in real-time.
 *
 * You will host this on a service like Render.com (see README).
 */

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const PORT = process.env.PORT || 10000;
const FMP_API_KEY = process.env.FMP_API_KEY;
const CMC_PRO_API_KEY = process.env.CMC_PRO_API_KEY;
const CRYPTO_IDS = '1,1027,5426,52,74,2010,2,1975,6636,5805'; // BTC, ETH, SOL, etc.

// API URLs
const FMP_FLOW_URL = `https://financialmodelingprep.com/api/v4/unusual-options-activity?apikey=${FMP_API_KEY}`;
const FMP_NEWS_URL = `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${FMP_API_KEY}`;
const CMC_CRYPTO_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${CRYPTO_IDS}`;

// --- Server Setup ---
const app = express();
app.use(cors()); // Enable CORS for all routes
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Simple health check endpoint for Render/hosting
app.get('/', (req, res) => {
  res.send('AlphaFlow Engine is running.');
});

// --- WebSocket Logic ---
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send a welcome message or initial data if you have it cached
  ws.send(JSON.stringify({
    type: 'SYSTEM_MESSAGE',
    payload: 'Successfully connected to AlphaFlow Engine.',
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
  });
});

/**
 * Sends data to every single connected client.
 * @param {object} data - The data object to send.
 */
function broadcast(data) {
  const jsonData = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(jsonData, (error) => {
        if (error) {
          console.error('Broadcast error:', error);
        }
      });
    }
  });
}

// --- Data Fetching Engine ---

/**
 * Fetches unusual options flow from FMP.
 */
async function fetchOptionsFlow() {
  // Only fetch if clients are connected
  if (wss.clients.size === 0) {
    console.log('No clients connected. Skipping options flow fetch.');
    return;
  }

  console.log('Fetching options flow...');
  try {
    const response = await axios.get(FMP_FLOW_URL);
    if (response.data && response.data.length > 0) {
      broadcast({
        type: 'OPTIONS_FLOW_UPDATE',
        payload: response.data,
      });
    }
  } catch (error) {
    console.error('Error fetching options flow:', error.message);
  }
}

/**
 * Fetches market news from FMP.
 */
async function fetchMarketNews() {
  if (wss.clients.size === 0) {
    console.log('No clients connected. Skipping news fetch.');
    return;
  }

  console.log('Fetching market news...');
  try {
    const response = await axios.get(FMP_NEWS_URL);
    if (response.data && response.data.length > 0) {
      broadcast({
        type: 'NEWS_UPDATE',
        payload: response.data,
      });
    }
  } catch (error) {
    console.error('Error fetching market news:', error.message);
  }
}

/**
 * Fetches crypto data from CoinMarketCap.
 */
async function fetchCryptoData() {
  if (wss.clients.size === 0) {
    console.log('No clients connected. Skipping crypto fetch.');
    return;
  }

  console.log('Fetching crypto data...');
  try {
    const response = await axios.get(CMC_CRYPTO_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_PRO_API_KEY,
        Accept: 'application/json',
      },
    });
    // CMC data is nested under 'data'
    if (response.data && response.data.data) {
      // Convert the object of coins into an array
      const cryptoArray = Object.values(response.data.data);
      broadcast({
        type: 'CRYPTO_UPDATE',
        payload: cryptoArray,
      });
    }
  } catch (error) {
    console.error('Error fetching crypto data:', error.response ? error.response.data : error.message);
  }
}

// --- Start Server and Timers ---
server.listen(PORT, () => {
  console.log(`AlphaFlow Engine listening on port ${PORT}`);

  // Start the data fetching intervals
  // Fetch immediately on start, then set intervals

  console.log('Starting initial data fetch...');
  fetchOptionsFlow();
  fetchMarketNews();
  fetchCryptoData();

  // Set intervals:
  // Options flow: every 60 seconds
  setInterval(fetchOptionsFlow, 60 * 1000);
  // News: every 5 minutes
  setInterval(fetchMarketNews, 5 * 60 * 1000);
  // Crypto: every 3 minutes
  setInterval(fetchCryptoData, 3 * 60 * 1000);
});