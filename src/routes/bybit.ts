import axios from "axios";
import { Hono } from "hono";
import { RestClientV5 } from "bybit-api";

export const BybitRouter = new Hono();

async function fetchClient() {
  const client = new RestClientV5({
    testnet: true,
    baseUrl: "https://api-testnet.bybit.com",
    key: process.env.BYBIT_TESTNET_API_KEY,
    secret: process.env.BYBIT_TESTNET_API_SECRET,

    // key: process.env.BYBIT_API_KEY,
    // secret: process.env.BYBIT_API_SECRET,
    recv_window: 20000,
    enable_time_sync: true,
    parse_exceptions: true,
  });
  console.log("bybit client ", client);
  return client;
}

BybitRouter.get("/symbols", async (c) => {
  try {
    const client = await fetchClient();
    const response = await client.getTickers({ category: "spot" });
    return c.json(response.result.list);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

BybitRouter.post("/order", async (c) => {
  const client = await fetchClient();
  //   const serverTime = await client.fetchServerTime();
  //   const serverLatency = await client.fetchLatencySummary();
  //   console.log("server time ", serverTime, " latency ", serverLatency);

  const { symbol, price, side } = await c.req.json();
  if (!symbol) return c.json({ error: "missing symbol" });

  try {
    const ticker = await client.submitOrder({
      side: side,
      orderType: "Limit",
      symbol: symbol,
      //   force: "gtc",
      //   size: "0.1",
      price: price,
      category: "spot",
      qty: price,
    });
    console.debug(ticker);
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
