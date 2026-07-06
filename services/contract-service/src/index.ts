import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { sequelize } from './utils/db'
import contractRoutes from './routes/contracts'
import clauseTemplateRoutes from './routes/clauseTemplates'
import { ClauseTemplate } from './models/clauseTemplate'
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
app.use('/clause-templates', clauseTemplateRoutes)

app.use((_, res) => res.status(404).json({ success: false, error: 'Route not found' }))

sequelize.sync({ alter: true }).then(async () => {
  console.log('Contract DB synced')
  await seedClauseTemplates()
  app.listen(PORT, () => console.log(`Contract service running on port ${PORT}`))
}).catch((err) => {
  console.error('DB connection failed:', err.message)
  process.exit(1)
})