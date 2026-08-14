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
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import swaggerUi from "swagger-ui-express"
import yamljs from "yamljs"
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const swaggerDocument = yamljs.load(path.join(__dirname, 'swagger.yaml'))

const app = express();

app.set('trust proxy', 1)

app.use(helmet())
app.use(cookieParser())




app.use('/checkout/webhook', express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true 
}))


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use("/auth",authRouter)
app.use("/service",serviceRouter) 
app.use("/availiability",availRouter)
app.use("/booking", bookingRouter)
app.use("/checkout", checkoutRouter)
app.use("/stats",statsRouter)

app.use("/*splat", (req, res, next) => {
  const error = new Error("Path Not Found!")
  error.status = "Fail";
  error.statusCode = 404;
  next(error);
});

app.use("/health",(req,res) => {
  return res.status(200).json({success: true, message: "Health Route is working"})
})

app.use(errorHandler)

scheduleCacheWarming()
scheduleWeeklyReports()

export default app;