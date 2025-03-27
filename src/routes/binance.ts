import { Hono } from "hono";
import { MainClient } from "binance";
import { createHmac } from "node:crypto";

export const BinanceRouter = new Hono();

const BASE_URL = "https://api.binance.com/api/v3";

async function fetchClient() {
  const client = new MainClient({
    useTestnet: true,
    api_key: process.env.BINANCE_TESTNET_API_KEY,
    api_secret: process.env.BINANCE_TESTNET_API_SECRET,
    baseUrl: "https://testnet.binance.vision",

    // api_key: process.env.BINANCE_API_KEY,
    // api_secret: process.env.BINANCE_API_SECRET,
    recvWindow: 2000,
  });
  console.log("binance client ", client);
  return client;
}

BinanceRouter.get("/exchangeInfo", async (c) => {
  try {
    const client = await fetchClient();
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
    const client = await fetchClient();
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
    const client = await fetchClient();
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
  const client = await fetchClient();
  const offset = await client.fetchTimeOffset();
  console.log("offset ", offset);
  await client.setTimeOffset(offset);

  const { symbol, quantity, side } = await c.req.json();
  if (!symbol) return c.json({ error: "missing symbol" });

  try {
    const ticker = await client.testNewOrder({
      side: side || "BUY",
      symbol: symbol,
      type: "LIMIT",
      quantity: quantity || 0.01,
    });
    return c.json(ticker);
  } catch (error) {
    console.error(
      `Error fetching details for ${symbol}:`,
      JSON.stringify(error)
    );
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details", details: error });
  }
});
BinanceRouter.post("/newOrder", async (c) => {
  try {
    const body = await c.req.json();
    const { symbol, side, type } = body;
    console.log(symbol, side, type);
    const client = await fetchClient();
    console.log(client);

    const newOrder = await client.submitNewOrder({
      symbol: symbol,
      side: side || "BUY",
      type: type || "LIMIT",
    });
    console.log(newOrder);
    return c.json(newOrder);
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

BinanceRouter.get("/account", async (c) => {
  try {
    const client = await fetchClient();
    const account = await client.getAccountInformation();
    return c.json(account);
  } catch (error) {
    console.log(error);
    c.status(400);
    return c.json({ error: "Unable to fetch account" });
  }
});

BinanceRouter.get("/openOrders", async (c) => {
  try {
    const client = await fetchClient();
    const orders = await client.getOpenOrders();
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching open orders:", String(error));
    return c.json({ error: "Failed to fetch open orders" });
  }
});

BinanceRouter.get("/history", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const limit = c.req.query("limit");
    const fromId = c.req.query("fromId");
    if (!symbol) {
      c.status(400);
      return c.json({ error: "missing symbol" });
    }
    const client = await fetchClient();
    const history = await client.getHistoricalTrades({
      symbol,
      limit: Number(limit) || 10,
      fromId: Number(fromId) || undefined
    });
    return c.json(history);
  } catch (error) {
    console.error("Error fetching symbol history:", String(error));
    return c.json({ error: "Failed to fetch symbol history" });
  }
});
