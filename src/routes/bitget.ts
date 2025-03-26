import axios from "axios";
import { Hono } from "hono";
import { RestClientV2, type SpotOrderRequestV2 } from "bitget-api";

export const BitgetRouter = new Hono();

const BITGET_API_KEY =
  process.env.BITGET_API_KEY || "bg_cadd68c7195fc0b93614aca088c4fc84";
const BITGET_API_SECRET =
  process.env.BITGET_API_SECRET ||
  "407b13df515489d538fca6d5afba1040c1e1186aed15f14500ad6d6e798fe705";

const client = new RestClientV2({
  apiKey: BITGET_API_KEY,
  apiSecret: BITGET_API_SECRET,
  apiPass: "ASBIDBSADasjdasndadajnweqe2981",
  recvWindow: 5000,

  // baseUrl: "https://testnet.binance.vision",
  // recvWindow: 1000,
  // syncIntervalMs: 1000,
  // disableTimeSync: false,
});

BitgetRouter.post("/order", async (c) => {
  const serverTime = await client.getServerTime();
  const serverLatency = await client.fetchLatencySummary();
  console.log("server time ", serverTime, " latency ", serverLatency);

  const { symbol } = await c.req.json();
  if (!symbol) return c.json({ error: "missing symbol" });

  try {
    const data: SpotOrderRequestV2 = {
      side: "buy",
      orderType: "limit",
      symbol: symbol,
      force: "gtc",
      size: "0.1",
      price: "0.1",
      
      // requestTime: (Number(serverTime.data.serverTime) + 500).toString(),
    };
    console.log("data ", data);
    const ticker = await client.spotSubmitOrder(data);
    console.debug(ticker);
    return c.json(ticker);
  } catch (error) {
    console.error(error);
    console.error(`Error fetching details for ${symbol}:`);
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details" });
  }
});
