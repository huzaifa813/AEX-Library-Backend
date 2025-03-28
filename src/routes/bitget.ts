import { Hono } from "hono";
import { RestClientV2, type SpotOrderRequestV2 } from "bitget-api";

export const BitgetRouter = new Hono();

async function fetchClient() {
  const client = new RestClientV2({
    apiKey: process.env.BITGET_API_KEY,
    apiSecret: process.env.BITGET_API_SECRET,
    apiPass: process.env.BITGET_API_PASS,
    recvWindow: 5000,

    // baseUrl: "https://testnet.binance.vision",
    // recvWindow: 1000,
    // syncIntervalMs: 1000,
    // disableTimeSync: false,
  });
  // console.log("bitget client ", client);
  return client;
}

BitgetRouter.get("/symbols", async (c) => {
  const client = await fetchClient();

  try {
    const ticker = await client.getSpotTicker();
    console.debug(ticker);
    return c.json(ticker);
  } catch (error) {
    console.error(error);
    console.error(`Error fetching details `);
    c.status(500);
    return c.json({ error: "Failed to fetch symbol details", details: error });
  }
});

BitgetRouter.get("/account", async (c) => {
  try {
    const client = await fetchClient();
    const response = await client.getSpotAccount();
    return c.json(response);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

BitgetRouter.post("/order", async (c) => {
  const client = await fetchClient();
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
    return c.json({ error: "Failed to fetch symbol details", details: error });
  }
});

BitgetRouter.post("/orderStatus", async (c) => {
  try {
    const { orderId, clientOid } = await c.req.json();
    if (!orderId && !clientOid) {
      return c.json(
        { error: "Missing required fields: Either orderId or clientOid" },
        400
      );
    }
    console.log("Fetching Order Status for:", { orderId, clientOid });
    const client = await fetchClient();
    const serverTime = await client.getServerTime();
    const serverLatency = await client.fetchLatencySummary();
    console.log("Server time:", serverTime, "Latency:", serverLatency);
    const response = await client.getSpotOrder({
      orderId,
      clientOid,
    });
    console.debug("Order Status Response:", response);
    return c.json(response);
  } catch (error) {
    console.error("Error fetching order status:", error);
    return c.json(
      { error: "Failed to fetch order status", details: error },
      400
    );
  }
});

BitgetRouter.post("/getAccBalance", async (c) => {
  try {
    const client = await fetchClient();
    const serverTime = await client.getServerTime();
    const serverLatency = await client.fetchLatencySummary();
    console.log("Server time:", serverTime, "Latency:", serverLatency);
    const response = await client.getBalances();
    return c.json(response);
  } catch (error) {
    return c.json(
      { error: "Failed to fetch account balance", details: error },
      400
    );
  }
});
