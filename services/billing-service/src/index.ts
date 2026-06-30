import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

import { initSubscriptionModel } from './models/subscription'
import billingRoutes from './routes/billing'
import webhookRoutes from './routes/webhook'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3005

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: false,
  }
)

initSubscriptionModel(sequelize)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)

// Stripe webhook needs the raw body — must be mounted BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), webhookRoutes)

app.use(express.json())

app.use('/api/billing', billingRoutes)

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'billing-service', status: 'ok' })
})

const start = async () => {
  try {
    await sequelize.authenticate()
    console.log('billing-service: DB connected')
    await sequelize.sync()
    app.listen(PORT, () => {
      console.log(`billing-service running on port ${PORT}`)
    })
  } catch (err) {
    console.error('billing-service failed to start:', err)
    process.exit(1)
  }
}

start()