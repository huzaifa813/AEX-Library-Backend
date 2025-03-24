require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors());

// Define MEXC API Base URL
const BASE_URL = "https://api.mexc.com";

// API Route to fetch MEXC trading symbols
app.get("/api/symbols", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/defaultSymbols`);
    // Ensure response is an array
    if (response.data) {
      res.json(response.data);
    } else {
      console.error("Unexpected API response format:", response.data);
      res.json([]); // Return an empty array instead of an object
    }
  } catch (error) {
    console.error("Error fetching symbols:", error.message);
    res.status(500).json({ error: "Failed to fetch symbols" });
  }
});

// API Route to fetch MEXC trading symbols
app.get("/api/exchangeInfo", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);

    if (response.data && response.data.symbols) {
      const symbolList = response.data.symbols.map((item) => ({
        symbol: item.symbol,
        baseAsset: item.baseAsset,
        quoteAsset: item.quoteAsset,
        status: item.status,
      }));
      res.json(symbolList);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching exchange info:", error.message);
    res.status(500).json({ error: "Failed to fetch exchange info" });
  }
});

app.get("/binance/api/exchangeInfo", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.binance.com/api/v3/exchangeInfo"
    );

    if (response.data && response.data.symbols) {
      // Extract symbols with their index
      const symbolList = response.data.symbols.map((item, index) => ({
        id: index + 1, // Start index from 1
        symbol: item.symbol,
      }));
      res.json(symbolList);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching exchange info:", error.message);
    res.status(500).json({ error: "Failed to fetch exchange info" });
  }
});

app.get("/binance/api/symbol/:symbol", async (req, res) => {
    const { symbol } = req.params;
  
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
      );
  
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching details for ${symbol}:`, error.message);
      res.status(500).json({ error: "Failed to fetch symbol details" });
    }
  });
  
  app.get("/binance/api/orderbook/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const response = await axios.get(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`);
      
      if (response.data) {
        res.json(response.data);
      } else {
        res.status(404).json({ error: "Order book data not found" });
      }
    } catch (error) {
      console.error("Error fetching order book:", error.message);
      res.status(500).json({ error: "Failed to fetch order book data" });
    }
  });
// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
