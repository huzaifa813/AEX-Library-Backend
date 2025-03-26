import axios from "axios";
import { Hono } from "hono";
import { RestClientV5 } from "bybit-api";

export const BybitRouter = new Hono();

const BYBIT_API_KEY = process.env.BYBIT_API_KEY || "V8fz3gBdavAd6chren";
const BYBIT_API_SECRET =
  process.env.BYBIT_API_SECRET || "bj1ErlRCFArUNaovRy7tRimYRFTZ5BawxsNK";
process.env.BYBITTRACE = "true";

const client = new RestClientV5({
  key: BYBIT_API_KEY,
  secret: BYBIT_API_SECRET,
  recv_window: 20000,
//   testnet: true,
//   baseUrl: "https://api-testnet.bybit.com",
  enable_time_sync: true,
  parse_exceptions: true,
});

BybitRouter.post("/order", async (c) => {
  //   const serverTime = await client.fetchServerTime();
  //   const serverLatency = await client.fetchLatencySummary();
  //   console.log("server time ", serverTime, " latency ", serverLatency);
  console.log("api ", BYBIT_API_KEY);

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
    console.debug(ticker)
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
