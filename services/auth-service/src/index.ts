import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Sequelize } from 'sequelize'
import { initUserModel, User } from './models/user'
import authRoutes from './routes/auth'
import { hashPassword } from './utils/hash'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = process.env.PORT || 3001

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
})


initUserModel(sequelize)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

app.use('/auth', authRoutes)

app.get('/health', async (_, res) => {
  try {
    await sequelize.authenticate()
    res.json({
      status: 'ok',
      service: 'auth-service',
      db: 'connected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      service: 'auth-service',
      db: 'disconnected',
      error: err.message,
    })
  }
})


const start = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connected')
    await sequelize.sync({ alter: true })
    console.log('✅ Models synced')
    
    // Seed user if not exists
    const email = 'bankalgisushrut@gmail.com'
    let user = await User.findOne({ where: { email } })
    const hashedPassword = await hashPassword('sushrut123')
    if (!user) {
      await User.create({
        email,
        password: hashedPassword,
        name: 'Sushrut Bankalgi',
        orgId: uuidv4(),
        role: 'admin',
        isVerified: true
      })
      console.log('🌱 Seeded user: bankalgisushrut@gmail.com with password sushrut123')
    } else {
      await user.update({ password: hashedPassword })
      console.log('🌱 Updated user sushrut password')
    }

    app.listen(PORT, () => console.log(`🚀 Auth service running on port ${PORT}`))
  } catch (err) {
    console.error('❌ Failed to start:', err)
    process.exit(1)
  }
}

start()