import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { Sequelize } from "sequelize"
import dotenv from "dotenv"

import { initReminderModel } from "./models/reminder"
import reminderRoutes from "./routes/reminders"
import { startReminderWorker } from "./workers/reminderWorker"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3006

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  }
)


initReminderModel(sequelize)

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)

app.use("/reminders", reminderRoutes)


app.get("/health", async (_req, res) => {
  try {
    await sequelize.authenticate()
    res.json({
      status: "ok",
      service: "scheduler-service",
      db: "connected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(503).json({
      status: "error",
      service: "scheduler-service",
      db: "disconnected",
      error: err.message,
    })
  }
})


const start = async () => {
  try {
    await sequelize.authenticate()
    console.log("scheduler-service: DB connected")
    await sequelize.sync()
    startReminderWorker()
    app.listen(PORT, () => {
      console.log(`scheduler-service running on port ${PORT}`)
    })
  } catch (err) {
    console.error("scheduler-service failed to start:", err)
    process.exit(1)
  }
}

start()
