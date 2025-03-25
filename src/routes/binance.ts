import axios from "axios";
import { Hono } from "hono";
import { MainClient } from "binance";
import { createHmac } from "node:crypto";

export const BinanceRouter = new Hono();

const BASE_URL = "https://api.binance.com/api/v3";

const client = new MainClient({
  useTestnet: true,
  api_key: 'ymXczypuhvcA44dyWMqdCcLiWuUCPOMOu5atDvwGaeA5sNOpI9FIwUvcW9S8EZ5C',
  api_secret: 'CctEoVFxsIMqFc5briy0blsvgfVbqYZCKi5U6nlL6dxbvfRtAVKZ7MwRpRY3Wp5j',
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

BinanceRouter.post("/newOrder", async (c) => {
  try {
    const body = await c.req.json();
    const { symbol, side, type } = body;
    console.log(symbol,side,type)
    console.log(client)
    
    const newOrder = await client.submitNewOrder({
      symbol: symbol,
      side: side,
      type: type,
    });
    console.log(newOrder);
  } catch (error: any) {
    console.error(
      "Error placing order:",
      error.response?.data || error.message
    );
    return c.json(
      {
        error: "Failed to place order",
        details: error.response?.data || error.message,
      },
      404
    );
  }
});

export default BinanceRouter;
