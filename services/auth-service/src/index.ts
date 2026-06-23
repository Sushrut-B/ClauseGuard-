import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Sequelize } from 'sequelize'
import { initUserModel } from './models/user'
import authRoutes from './routes/auth'

const app = express()
const PORT = process.env.PORT || 3001

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  logging: false,
})

initUserModel(sequelize)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

app.use('/auth', authRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-service' }))

const start = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connected')
    await sequelize.sync({ alter: true })
    console.log('✅ Models synced')
    app.listen(PORT, () => console.log(`🚀 Auth service running on port ${PORT}`))
  } catch (err) {
    console.error('❌ Failed to start:', err)
    process.exit(1)
  }
}

start()