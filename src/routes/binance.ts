import axios from "axios";
import { Hono } from "hono";
import { MainClient } from "binance";

export const BinanceRouter = new Hono();

const BASE_URL = "https://api.binance.com/api/v3";

const client = new MainClient({
  useTestnet: true,
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
  baseUrl: "https://testnet.binance.vision",
});

// API Route to fetch MEXC trading symbols
BinanceRouter.get("/exchangeInfo", async (c) => {
  try {
    const exchangeInfo = await client.getExchangeInfo();
    const symbols = exchangeInfo.symbols?.map((i, index) => ({
      id: index + 1,
      symbol: i.symbol,
    }));
    return c.json(symbols);
  } catch (error) {
    console.error("Error fetching symbols:", String(error));
    return c.json({ error: "Failed to fetch symbols" });
  }
});


BinanceRouter.get("/symbol", async (c) => {
  const symbol = c.req.query("symbol");
  try {
    const ticker = await client.getTradingDayTicker({ symbol: symbol });
    return c.json(ticker);
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, String(error));
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details" });
  }
});

BinanceRouter.get("/orderbook", async (c) => {
  const symbol = c.req.query("symbol");
  try {
    if (!symbol) {
      c.status(400);
      return c.json({ error: "Symbol not provided" });
    }
    const orderbook = await client.getOrderBook({ symbol: symbol });
    return c.json(orderbook);
  } catch (error) {
    console.error(`Error fetching order book ${symbol}:`, String(error));
    c.status(500);
    return c.json({ error: "Failed to fetch order book data" });
  }
});

BinanceRouter.post("/order", async (c) => {
  const offset = await client.fetchTimeOffset();
  console.log("offset ", offset);
  await client.setTimeOffset(offset);

  const { symbol } = await c.req.json();
  if (!symbol) return c.json({ error: "missing symbol" });

  try {
    const ticker = await client.submitNewOrder({
      side: "BUY",
      symbol: symbol,
      type: "LIMIT",
      quantity: 0.01,
    });
    return c.json(ticker);
  } catch (error) {
    console.error(
      `Error fetching details for ${symbol}:`,
      JSON.stringify(error)
    );
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details" });
  }
});
