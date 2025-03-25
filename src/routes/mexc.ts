import axios from "axios";
import { Hono } from "hono";
import { createHmac } from "node:crypto";

export const MexcRouter = new Hono();

const BASE_URL = "https://api.mexc.com";

// API Route to fetch MEXC trading symbols
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

// API Route to fetch MEXC trading symbols
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

// API Route to fetch MEXC order book (depth)
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
      "Error fetching order book:",
      error.response?.data || error.message
    );
    c.status(500);
    return c.json({
      error: "Failed to fetch order book",
      details: error.response?.data || error.message,
    });
  }
});

// API Route to create MEXC order symbols
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

// API Route to cancel MEXC order symbols
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

// MexcRouter.get("/:id", (c) => {
//   const id = c.req.param("id");
//   return c.json({ message: `User with id ${id}` });
// });

// MexcRouter.post("/", async (c) => {
//   const body = await c.req.json();
//   return c.json({ message: "User created", data: body });
// });
