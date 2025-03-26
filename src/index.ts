import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { MexcRouter } from "@/routes/mexc.js";
import { BinanceRouter } from "@/routes/binance.js";
import { prettyJSON } from "hono/pretty-json";
import { BitgetRouter } from "./routes/bitget.js";
import { BybitRouter } from "./routes/bybit.js";
import dotenv from "dotenv";

dotenv.configDotenv({ debug: true });
const app = new Hono();
app.use(cors());
app.use(logger());
app.use(prettyJSON());

app.route("/mexc", MexcRouter);
app.route("/binance", BinanceRouter);
app.route("/bitget", BitgetRouter);
app.route("/bybit", BybitRouter);

app.get("/", (c) => c.text("Hello Hono!"));

export default app;
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
