import { Hono } from "hono";
import { MainClient } from "binance";
import { createHmac } from "node:crypto";
import axios from "axios";

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

BinanceRouter.get("/account", async (c) => {
  try {
    const client = await fetchClient();
    const account = await client.getAccountInformation();
    return c.json(account);
  } catch (error) {
    console.log(error);
    c.status(400);
    c.json({ error: "Unable to fetch account" });
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

BinanceRouter.get("/openOrders", async (c) => {
  try {
    const client = await fetchClient();
    const orders = await client.getOpenOrders();
    return c.json(orders);
  } catch (error) {
    console.error("Error fetching open orders:", String(error));
    return c.json({ error: error });
  }
});

BinanceRouter.post("/ammendOrders", async (c) => {
  try {
    const { symbol, side, type, cancelReplaceMode } = await c.req.json();
    if (!symbol || !side || !type || !cancelReplaceMode) {
      return c.json(
        {
          error:
            "Missing required fields: symbol, side, type, cancelReplaceMode",
        },
        400
      );
    }

    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&side=${side}&type=${type}&cancelReplaceMode=${cancelReplaceMode}&timestamp=${timestamp}`;
    console.log(queryString);
    const signature = createHmac(
      "sha256",
      "a658fcef6f3f445f77a06086d0277d3788062aa5d5c5d778ed306125de959815"
    )
      .update(queryString)
      .digest("hex");
    console.log("Request Params:", {
      symbol,
      side,
      type,
      cancelReplaceMode,
      timestamp,
    });
    console.log("Query String:", queryString);
    console.log("Signature:", signature);
    console.log("API Key:", process.env.BINANCE_API_KEY);

    const response = await axios.post(
      "https://api.binance.com/api/v3/order/cancelReplace",
      null,
      {
        headers: {
          "X-MBX-APIKEY": process.env.BINANCE_TESTNET_API_KEY,
        },
        params: {
          symbol,
          side,
          type,
          cancelReplaceMode,
          timestamp,
          signature,
        },
      }
    );

    return c.json(response.data);
  } catch (error) {
    return c.json(
      {
        error: "Failed to amend order",
        details: error,
      },
      400
    );
  }
});

BinanceRouter.post("/cancelOrders", async (c) => {
  try {
    const {
      symbol,
      orderId,
      origClientOrderId,
      newClientOrderId,
      cancelRestrictions,
    } = await c.req.json();

    if (!symbol) {
      return c.json({ error: "Missing required field: symbol" }, 400);
    }

    if (!orderId && !origClientOrderId) {
      return c.json(
        { error: "Either orderId or origClientOrderId is required" },
        400
      );
    }

    const timestamp = Date.now().toString();
    const queryParams = new URLSearchParams({ symbol, timestamp });

    if (orderId) queryParams.append("orderId", orderId);
    if (origClientOrderId)
      queryParams.append("origClientOrderId", origClientOrderId);
    if (newClientOrderId)
      queryParams.append("newClientOrderId", newClientOrderId);
    if (cancelRestrictions)
      queryParams.append("cancelRestrictions", cancelRestrictions);

    // Generate signature
    const signature = createHmac(
      "sha256",
      "CctEoVFxsIMqFc5briy0blsvgfVbqYZCKi5U6nlL6dxbvfRtAVKZ7MwRpRY3Wp5j"
    )
      .update(queryParams.toString())
      .digest("hex");

    queryParams.append("signature", signature);

    const response = await axios.delete(
      `https://api.binance.com/api/v3/order?${queryParams.toString()}`,
      {
        headers: {
          "X-MBX-APIKEY": process.env.BINANCE_API_KEY,
        },
      }
    );

    return c.json(response.data);
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to cancel order",
        details: error.response ? error.response.data : error.message,
      },
      400
    );
  }
});

BinanceRouter.post("/cancelOrders", async (c) => {
  try {
  } catch (error: any) {
    return c.json(
      {
        error: "Failed to cancel order",
        details: error.response ? error.response.data : error.message,
      },
      400
    );
  }
});
