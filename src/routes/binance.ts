import axios from "axios";
import { Hono } from "hono";

export const BinanceRouter = new Hono();

const BASE_URL = "https://api.binance.com/api/v3";

// API Route to fetch MEXC trading symbols
BinanceRouter.get("/exchangeInfo", async (c) => {
  try {
    const response = await axios.get(`${BASE_URL}/exchangeInfo`);

    if (response.data && response.data.symbols) {
      // Extract symbols with their index
      const symbolList = response.data.symbols.map(
        (item: any, index: number) => ({
          id: index + 1, // Start index from 1
          symbol: item.symbol,
        })
      );
      return c.json(symbolList);
    } else {
      console.error("Unexpected API response format:", response.data);
      return c.json([]); // Return an empty array instead of an object
    }
  } catch (error) {
    console.error("Error fetching symbols:", String(error));
    return c.json({ error: "Failed to fetch symbols" });
  }
});

BinanceRouter.get("/symbol", async (c) => {
  const symbol = c.req.query("symbol");
  try {
    const response = await axios.get(
      `${BASE_URL}/ticker/24hr?symbol=${symbol}`
    );

    return c.json(response.data);
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, String(error));
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details" });
  }
});

BinanceRouter.get("/orderbook", async (c) => {
  const symbol = c.req.query("symbol");
  try {
    const response = await axios.get(
      `${BASE_URL}/depth?symbol=${symbol}&limit=10`
    );

    if (response.data) {
      return c.json(response.data);
    } else {
      c.status(404);
      return c.json({ error: "Order book data not found" });
    }
  } catch (error) {
    console.error(`Error fetching order book ${symbol}:`, String(error));
    c.status(500);
    return c.json({ error: "Failed to fetch order book data" });
  }
});
