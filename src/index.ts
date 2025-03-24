import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { MexcRouter } from '@/routes/mexc.js';
import { BinanceRouter } from '@/routes/binance.js';

const app = new Hono();
app.use(cors())
app.use(logger())

app.route('/mexc', MexcRouter);
app.route('/binance', BinanceRouter);

app.get('/', (c) => c.text('Hello Hono!'));

export default app;
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
