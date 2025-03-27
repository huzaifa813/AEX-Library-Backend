import axios from "axios";
import { Hono } from "hono";
import { createHmac } from "node:crypto";
import * as Mexc from "mexc-api-sdk";

export const MexcRouter = new Hono();

const BASE_URL = "https://api.mexc.com";

async function fetchClient() {
  const client = new Mexc.Spot(
    process.env.MEXC_API_KEY,
    process.env.MEXC_API_SECRET
  );
  console.log("mexc client ", client);
  return client;
}

MexcRouter.get("/exchangeInfo", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const response = await axios.get(`${BASE_URL}/api/v3/exchangeInfo`);

    if (response.data?.symbols) {
      // If a specific symbol is requested, filter it
      if (symbol) {
        const matchedSymbol = response.data.symbols.find(
          (item: any) => item.symbol === symbol
        );
        if (matchedSymbol) {
          return c.json(matchedSymbol); // Return full details of the matched symbol
        } else {
          c.status(404);
          return c.json({ error: "Symbol not found" });
        }
      } else {
        // Return the full exchange info
        return c.json(response.data);
      }
    } else {
      c.status(500);
      return c.json({ error: "Unexpected API response format" });
    }
  } catch (error) {
    console.error("Error fetching exchange info:", String(error));
    c.status(500);
    return c.json({ error: "Failed to fetch exchange info" });
  }
});

MexcRouter.get("/orderBook", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const limit = c.req.query("limit");
    console.log(symbol, limit);
    const response = await axios.get(`${BASE_URL}/api/v3/depth`, {
      params: { symbol, limit },
      headers: {
        "Content-Type": "application/json",
        "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP",
      },
    });

    return c.json(response.data);
  } catch (error: any) {
    console.error(
      "Error fetching order book:====",
      error.response?.data || error.message
    );
    c.status(500);
    return c.json({
      error: "Failed to fetch order book",
      details: error.response?.data || error.message,
    });
  }
});

MexcRouter.post("/newOrder", async (c) => {
  try {
    const body = await c.req.json();
    const { symbol, side, type, quantity, price } = body;
    const params = {
      symbol,
      side,
      type,
      quantity,
      price,
      timestamp: Date.now().toString(),
    };
    const queryString = new URLSearchParams(params).toString();
    const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
      .update(queryString)
      .digest("hex");
    const response = await axios.post(
      `${BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP",
        },
      }
    );
    return c.json(response.data);
  } catch (error: any) {
    console.error("Error placing order:", error.response?.data);

    return c.json({
      error: "Failed to place order",
      details: error.response?.data,
    });
  }
});

MexcRouter.delete("/cancelOrder", async (c) => {
  try {
    const body = await c.req.json();
    const { symbol, origClientOrderId } = body;
    console.log(symbol, origClientOrderId);
    const params: Record<string, string> = {
      symbol: symbol,
      origClientOrderId: origClientOrderId,
      timestamp: Date.now().toString(), // Mandatory
    };
    console.log(params);
    if (origClientOrderId) params.origClientOrderId = origClientOrderId;
    const queryString = new URLSearchParams(params).toString();
    const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
      .update(queryString)
      .digest("hex");
    const response = await axios.delete(
      `${BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP",
        },
      }
    );
    return c.json(response.data);
  } catch (error: any) {
    console.error(
      "Error canceling order:",
      error.response?.data || error.message
    );
    return c.json(
      {
        error: "Failed to cancel order",
        details: error.response?.data || error.message,
      },
      500
    );
  }
});

MexcRouter.get("/queryOrder", async (c) => {
  try {
    // Extract query params from URL (not from body)
    const symbol = c.req.query("symbol");
    const origClientOrderId = c.req.query("origClientOrderId");
    const orderId = c.req.query("orderId");

    if (!symbol) {
      c.status(400);
      return c.json({ error: "Symbol is required" });
    }

    if (!orderId && !origClientOrderId) {
      c.status(400);
      return c.json({
        error: "Either orderId or origClientOrderId is required",
      });
    }

    // Construct parameters
    const params: Record<string, string> = {
      symbol,
      timestamp: Date.now().toString(),
    };
    if (orderId) params.orderId = orderId;
    if (origClientOrderId) params.origClientOrderId = origClientOrderId;

    // Generate query string with HMAC signature
    const queryString = new URLSearchParams(params).toString();
    const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
      .update(queryString)
      .digest("hex");

    // Make API call
    const response = await axios.get(
      `${BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP",
        },
      }
    );

    return c.json(response.data);
  } catch (error: any) {
    console.error(
      "Error querying order:",
      error.response?.data || error.message
    );

    c.status(500);
    return c.json({
      error: "Failed to query order",
      details: error.response?.data || error.message,
    });
  }
});

MexcRouter.post("/testOrder", async (c) => {
  try {
    const client = await fetchClient();
    const res = await client.newOrderTest("DOGENUSDT", "BUY", "LIMIT", {
      price: "0.1",
      recvWindow: 50000,
    });
    const serverTime = await client.time();
    console.log("server time ", serverTime);
    console.log("order res ", res);
    return c.json({ result: res });
  } catch (error) {
    console.error("error ", error);
    return c.json({ error: "Unable to test order", details: error }, 400);
  }
});

MexcRouter.get("/account", async (c) => {
  try {
    const client = await fetchClient();
    const res = await client.accountInfo();
    console.log("order res ", res);
    return c.json({ result: res || "" });
  } catch (error) {
    console.log("error ", error);
    return c.json({ error: "Unable to create order" });
  }
});

MexcRouter.get("/open", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    if (!symbol) {
      c.status(400);
      return c.json({ error: "symbol missing" });
    }
    const client = await fetchClient();
    const res = await client.openOrders(symbol);
    console.log("order res ", res);
    return c.json({ result: res || "" });
  } catch (error) {
    console.log("error ", error);
    return c.json({ error: "Unable to fetch open order" });
  }
});

MexcRouter.post("/testingOrder", async (c) => {
  try {
    const client = await fetchClient();
    const res = await client.newOrder("DOGENUSDT", "BUY", "LIMIT", {
      price: "1",
      quantity: "1",
      recvWindow: 50000,
    });
    const serverTime = await client.time();
    console.log("server time ", serverTime);
    console.log("order res ", res);
    c.json({ result: res || "" });
  } catch (error) {
    console.log("error ", error);
    return c.json({ error: "Unable to create order" });
  }
});

MexcRouter.get("/symbols", async (c) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/v3/defaultSymbols`);
    // Ensure response is an array
    if (response.data) {
      return c.json(response.data);
    } else {
      console.error("Unexpected API response format:", response.data);
      return c.json([]); // Return an empty array instead of an object
    }
  } catch (error) {
    console.error("Error fetching symbols:", String(error));
    return c.json({ error: "Failed to fetch symbols" });
  }
});

MexcRouter.get("/currOpenOrders", async (c) => {
  try {
    const { symbol } = c.req.query();
    if (!symbol) {
      return c.json({ error: "Symbol is required" }, 400);
    }
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&timestamp=${timestamp}`;
    const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
      .update(queryString)
      .digest("hex");

    const response = await axios.get(`${BASE_URL}/api/v3/openOrders`, {
      params: {
        symbol,
        timestamp,
        signature,
      },
      headers: {
        "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP",
      },
    });
    return c.json(response.data);
  } catch (error: any) {
    return c.json(
      {
        error: error,
        details: error.response ? error.response.data : error.message,
      },
      400
    );
  }
});

MexcRouter.get("/accDetails", async (c) => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
      .update(queryString)
      .digest("hex");
    const response = await axios.get(`${BASE_URL}/api/v3/account`, {
      params: { timestamp, signature },
      headers: { "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP" },
    });
    return c.json(response.data);
  } catch (error: any) {
    return c.json(
      {
        error: error,
        details: error.response ? error.response.data : error.message,
      },
      400
    );
  }
});

MexcRouter.get("/accTradeList", async (c) => {
  try {
    // const { symbol } = c.req.query();
    // if (!symbol) return c.json({ error: "Symbol is required" }, 400);
    // const timestamp = Date.now();
    // const queryString = `symbol=${symbol}&timestamp=${timestamp}`;
    // const signature = createHmac("sha256", "89a6ebe7c4864346baafa5b50b5990f3")
    //   .update(queryString)
    //   .digest("hex");
    // console.log("🔍 Query String:", queryString);
    // console.log("🔑 Signature:", signature);
    // const response = await axios.get(`${BASE_URL}/api/v3/myTrades`, {
    //   params: { symbol, timestamp, signature },
    //   headers: { "X-MEXC-APIKEY": "mx0vgllkjmzsF0YnvP" },
    // });
    // return c.json(response.data);

    const symbol = c.req.query("symbol");
    if (!symbol) return c.json({});
    const client = await fetchClient();
    const response = await client.accountTradeList(symbol);
    console.log(response);
    return c.json(response);
  } catch (error: any) {
    return c.json(
      {
        error: error,
        details: error.response ? error.response.data : error.message,
      },
      400
    );
  }
});
