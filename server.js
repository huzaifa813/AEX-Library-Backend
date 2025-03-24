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
          status: item.status
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
  

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
