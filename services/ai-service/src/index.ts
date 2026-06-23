import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import analyzeRouter from './routes/analyze'

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

app.use('/ai', analyzeRouter)

app.use((_, res) => res.status(404).json({ success: false, error: 'Route not found' }))

app.listen(PORT, () => console.log(`🚀 AI service running on port ${PORT}`))