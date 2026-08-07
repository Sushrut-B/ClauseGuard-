import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { sequelize } from './utils/db'
import contractRoutes from './routes/contracts'
import clauseTemplateRoutes from './routes/clauseTemplates'
import signatureRoutes from './routes/signatures'
import collaborationRoutes from './routes/collaboration'
import auditLogRoutes from './routes/auditLogs'
import { ClauseTemplate } from './models/clauseTemplate'
import { ContractShare } from './models/contractShare'
import { ContractComment } from './models/contractComment'
import { AuditLog } from './models/auditLog'
import { seedClauseTemplates } from './utils/seedClauses'

const app = express()
const PORT = process.env.PORT || 3002

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'contract-service',
  timestamp: new Date().toISOString(),
}))

app.use('/contracts', contractRoutes)
app.use('/contracts', signatureRoutes)
app.use('/contracts', collaborationRoutes)
app.use('/audit', auditLogRoutes)
app.use('/clause-templates', clauseTemplateRoutes)

app.get('/health', async (_, res) => {
  try {
    await sequelize.authenticate()
    res.json({
      status: 'ok',
      service: 'contract-service',
      db: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      service: 'contract-service',
      db: 'disconnected',
      error: err.message,
    })
  }
})

app.use((_, res) => res.status(404).json({ success: false, error: 'Route not found' }))


sequelize.sync({ alter: true }).then(async () => {
  console.log('Contract DB synced')
  await seedClauseTemplates()
  app.listen(PORT, () => console.log(`Contract service running on port ${PORT}`))
}).catch((err) => {
  console.error('DB connection failed:', err.message)
  process.exit(1)
})