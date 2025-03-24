import axios from "axios";
import { Hono } from "hono";

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

// MexcRouter.get("/:id", (c) => {
//   const id = c.req.param("id");
//   return c.json({ message: `User with id ${id}` });
// });
// MexcRouter.post("/", async (c) => {
//   const body = await c.req.json();
//   return c.json({ message: "User created", data: body });
// });
