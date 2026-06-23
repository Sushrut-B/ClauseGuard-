import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { registerUser, loginUser } from '../services/authService'
import { verifyRefreshToken, generateAccessToken, verifyAccessToken } from '../utils/jwt'
import { User } from '../models/user'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body
    const { user, accessToken, refreshToken } = await registerUser(email, password, name)
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await loginUser(email, password)
    res.status(200).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    })
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message })
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ success: false, error: 'No token' })
    const payload = verifyRefreshToken(refreshToken)
    const user = await User.findByPk(payload.userId)
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success: false, error: 'Invalid token' })
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    })
    res.json({ success: true, data: { accessToken } })
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    const user = await User.findByPk(payload.userId)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err: any) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
})

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ success: false, error: 'No token provided' })
    const user = await User.findOne({ where: { refreshToken } })
    if (user) {
      await user.update({ refreshToken: null })
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router