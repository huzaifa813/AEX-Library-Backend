import { RestClientV5 } from "bybit-api";
import { Hono } from "hono";

export const ByBitRouter = new Hono();

const client = new RestClientV5({
  key: "V8fz3gBdavAd6chren",
  secret: "bj1ErlRCFArUNaovRy7tRimYRFTZ5BawxsNK",
});
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

ByBitRouter.post("/submitOrder", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: "Invalid JSON input" }, 400);
    }
    const { symbol, side, orderType, qty } = body;
    if (!symbol || !side || !orderType || !qty) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    const response = await client.submitOrder({
      category: "spot",
      symbol,
      side,
      orderType,
      qty: String(qty),
    });
    return c.json({ success: true, order: response });
  } catch (error) {
    console.error("Order submission error:", error);
    return c.json(
      {
        error: "Failed to place order",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/amendOrder", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);

    if (!body) {
      return c.json({ error: "Invalid JSON input" }, 400);
    }

    const {
      symbol,
      orderLinkId,
      triggerPrice,
      qty,
      price,
      takeProfit,
      stopLoss,
    } = body;

    const response = await client.amendOrder({
      category: "linear",
      symbol,
      orderLinkId,
      triggerPrice: triggerPrice ? String(triggerPrice) : undefined,
      qty: qty ? String(qty) : undefined,
      price: price ? String(price) : undefined,
      takeProfit: takeProfit ? String(takeProfit) : "0",
      stopLoss: stopLoss ? String(stopLoss) : "0",
    });
    return c.json({ success: true, amendedOrder: response });
  } catch (error) {
    console.error("Order amendment error:", error);
    return c.json(
      {
        error: "Failed to amend order",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/cancelOrder", async (c) => {
  try {
    const { orderId, symbol, category } = await c.req.json();

    if (!orderId || !symbol || !category) {
      return c.json(
        { error: "Missing required fields: orderId, symbol, or category" },
        400
      );
    }

    const response = await client.cancelOrder({
      category: category,
      symbol: symbol,
      orderId: orderId,
    });

    return c.json({ success: true, response });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return c.json(
      {
        error: "Failed to cancel order",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/spot-margin-trade", async (c) => {
  try {
    const response = await client.getSpotMarginState();
    console.log("Spot Margin Trade Response:", response);
    return c.json({ success: true, data: response });
  } catch (error) {
    console.error("Spot Margin Trade Error:", error);
    return c.json(
      {
        error: "Failed to retrieve spot margin trade state",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/getTickers", async (c) => {
  try {
    const { symbol } = await c.req.json(); // Get symbol from request body
    const response = await client.getTickers({
      category: "inverse", // Use 'spot' if working with spot markets
      symbol: symbol || "BTCUSDT", // Default to BTCUSDT if no symbol is provided
    });

    console.log("Ticker Response:", response);
    return c.json({ success: true, data: response });
  } catch (error) {
    console.error("Spot Margin Trade Error:", error);
    return c.json(
      {
        error: "Failed to retrieve ticker data",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/getOrderbook", async (c) => {
  try {
    const { symbol, category } = await c.req.json(); // Get parameters from request body

    const response = await client.getOrderbook({
      category: category || "linear", // Default category to linear
      symbol: symbol || "BTCUSDT", // Default symbol to BTCUSDT
    });
    return c.json({ success: true, data: response });
  } catch (error) {
    console.error("Orderbook Retrieval Error:", error);
    return c.json(
      {
        error: "Failed to retrieve orderbook data",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.post("/getAccountInfo", async (c) => {
  try {
    const response = await client.getWalletBalance({
      accountType: "UNIFIED",
    });
    console.log("Account Info Response:", response);
    return c.json({ success: true, data: response });
  } catch (error) {
    console.error("Account Info Retrieval Error:", error);
    return c.json(
      {
        error: "Failed to retrieve account info",
        details: error,
      },
      500
    );
  }
});

ByBitRouter.get("/symbols", async (c) => {
  try {
    const client = await fetchClient();
    const response = await client.getTickers({ category: "spot" });
    return c.json(response.result.list);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

ByBitRouter.get("/account", async (c) => {
  try {
    const client = await fetchClient();
    const response = await client.getAccountInfo();
    return c.json(response);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

ByBitRouter.post("/order", async (c) => {
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

ByBitRouter.post("/copy", async (c) => {
  const client = await fetchClient();
  const result = await client.getInstrumentsInfo({
    category: "option",
    status: "Trading",
  });
  return c.json(result);
});

ByBitRouter.get("/history", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const limit = c.req.query("limit");
    if (!symbol) {
      c.status(400);
      return c.json({ error: "Missing Symbol" });
    }
    const client = await fetchClient();
    const response = await client.getPublicTradingHistory({
      category: "spot",
      symbol,
      limit: Number(limit) || 10,
    });
    return c.json(response);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

ByBitRouter.get("/openOrder", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const limit = c.req.query("limit");
    if (!symbol) {
      c.status(400);
      return c.json({ error: "Missing Symbol" });
    }
    const client = await fetchClient();
    const response = await client.getActiveOrders({
      category: "option",
      symbol,
      limit: Number(limit) || 10,
      openOnly: 1
    });
    return c.json(response);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});

ByBitRouter.get("/depositAddress", async (c) => {
  try {
    const coin = c.req.query("coin");
    const limit = c.req.query("limit");
    if (!coin) {
      c.status(400);
      return c.json({ error: "Missing coin" });
    }
    const client = await fetchClient();
    const response = await client.getMasterDepositAddress(coin,);
    return c.json(response);
  } catch (error) {
    c.status(400);
    return c.json({});
  }
});