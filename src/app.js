import express from "express"
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from "./routes/auth.Routes.js"
import serviceRouter from "./routes/service.Routes.js"
import availRouter from "./routes/avail.Routes.js"
import bookingRouter from "./routes/booking.Routes.js"
import statsRouter from "./routes/stats.Routes.js"
import checkoutRouter from "./routes/checkout.Routes.js"
import "./queues/emailQueue.js"
import { scheduleCacheWarming } from "./queues/cacheQueue.js"
import { scheduleWeeklyReports } from "./queues/reportQueue.js";
import { monthlyStatsReset, staffStatsReset, weeklyStatsReset } from "./queues/staffStatsQueue.js";
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import swaggerUi from "swagger-ui-express"
import yamljs from "yamljs"
import { fileURLToPath } from 'url'
import path from 'path'
import { expressMiddleware } from '@apollo/server/express4';
import { createApolloServer } from './graphql/apolloServer.js';
import { buildGraphQLContext } from './graphql/context.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const swaggerDocument = yamljs.load(path.join(__dirname, 'swagger.yaml'))

const app = express();

app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cookieParser())

// Initialize and mount Apollo GraphQL Server
export const apolloServer = createApolloServer();
await apolloServer.start();

app.use(
  '/graphql',
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  }),
  express.json(),
  (req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
  },
  expressMiddleware(apolloServer, {
    context: buildGraphQLContext,
  })
);




app.use('/checkout/webhook', express.raw({ type: 'application/json' }))

const configuredFrontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const allowedOrigins = [
  configuredFrontend,
  'https://appointment-booking-saas.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin)
    ) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use("/auth", authRouter)
app.use("/service", serviceRouter)
app.use("/availiability", availRouter)
app.use("/booking", bookingRouter)
app.use("/checkout", checkoutRouter)
app.use("/stats", statsRouter)
app.use("/health",(req,res) => {
  return res.status(200).json({success: true, message: "Health Route is working"})
})

app.use("/*splat", (req, res, next) => {
  const error = new Error("Path Not Found!")
  error.status = "Fail";
  error.statusCode = 404;
  next(error);
});


app.use(errorHandler)

scheduleCacheWarming()
scheduleWeeklyReports()
staffStatsReset()
weeklyStatsReset()
monthlyStatsReset()

export default app;