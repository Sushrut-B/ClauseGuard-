import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Analysis } from './models/analysis'
import { PlaybookRule } from './models/playbook'
import { Correction } from './models/correction'
import aiRoutes from './routes/ai'
import analyzeRoutes from './routes/analyze'
import playbookRoutes from './routes/playbook'
import stitchRoutes from './routes/stitch'
import { sequelize } from './config/database'
import './queues/analysisQueue'

const app = express()
const PORT = process.env.PORT || 3003

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))

import { geminiCircuitBreaker } from './utils/circuitBreaker'

app.get('/health', async (_, res) => {
  try {
    await sequelize.authenticate()
    res.json({
      status: 'ok',
      service: 'ai-service',
      db: 'connected',
      circuitBreakerState: geminiCircuitBreaker.getState(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      service: 'ai-service',
      db: 'disconnected',
      error: err.message,
    })
  }
})


app.use('/ai', analyzeRoutes)
app.use('/ai', aiRoutes)
app.use('/ai/playbook', playbookRoutes)
app.use('/ai/stitch', stitchRoutes)


app.use((_, res) => res.status(404).json({ success: false, error: 'Route not found' }))

sequelize.authenticate().then(async () => {
  await Analysis.sync({ alter: true })
  await PlaybookRule.sync({ alter: true })
  await Correction.sync({ alter: true })
  console.log('PostgreSQL connected & synced')
  app.listen(PORT, () => console.log(`🚀 AI service running on port ${PORT}`))
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message)
  process.exit(1)
})