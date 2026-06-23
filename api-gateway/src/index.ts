import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { globalLimiter } from './middleware/rateLimiter'
import proxyRouter from './routes/proxy'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(globalLimiter)

// ⚠️ DO NOT add express.json() here — it breaks proxy body forwarding

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'api-gateway',
  timestamp: new Date().toISOString(),
  services: {
    auth:         process.env.AUTH_SERVICE_URL,
    contract:     process.env.CONTRACT_SERVICE_URL,
    ai:           process.env.AI_SERVICE_URL,
    notification: process.env.NOTIFICATION_SERVICE_URL,
    billing:      process.env.BILLING_SERVICE_URL,
    scheduler:    process.env.SCHEDULER_SERVICE_URL,
  }
}))

// All routes go through proxy
app.use('/api', proxyRouter)

// 404 handler
app.use((_, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`)
  console.log(`📡 Proxying to:`)
  console.log(`   Auth     → ${process.env.AUTH_SERVICE_URL}`)
  console.log(`   Contract → ${process.env.CONTRACT_SERVICE_URL}`)
  console.log(`   AI       → ${process.env.AI_SERVICE_URL}`)
})