import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { Analysis } from './models/analysis'
import { PlaybookRule } from './models/playbook'
import aiRoutes from './routes/ai'
import analyzeRoutes from './routes/analyze'
import playbookRoutes from './routes/playbook'
import { sequelize } from './config/database'
import './queues/analysisQueue'

const app = express()
const PORT = process.env.PORT || 3003

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'ai-service',
  timestamp: new Date().toISOString(),
}))

app.use('/ai', analyzeRoutes)
app.use('/ai', aiRoutes)
app.use('/ai/playbook', playbookRoutes)

app.use((_, res) => res.status(404).json({ success: false, error: 'Route not found' }))

sequelize.authenticate().then(async () => {
  await Analysis.sync({ alter: true })
  await PlaybookRule.sync({ alter: true })
  console.log('PostgreSQL connected & synced')
  app.listen(PORT, () => console.log(`🚀 AI service running on port ${PORT}`))
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message)
  process.exit(1)
})