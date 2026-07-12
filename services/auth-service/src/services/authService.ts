import { v4 as uuidv4 } from 'uuid'
import { User } from '../models/user'
import { hashPassword, comparePassword } from '../utils/hash'
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const registerUser = async (
  email: string,
  password: string,
  name: string
) => {
  const existing = await User.findOne({ where: { email } })
  if (existing) throw new Error('Email already registered')

  const hashed = await hashPassword(password)
  const orgId = uuidv4()

  const user = await User.create({
    email,
    password: hashed,
    name,
    orgId,
    role: 'admin',
    isVerified: false,
  })

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await user.update({ refreshToken })

  return { user, accessToken, refreshToken }
}

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email } })
  if (!user) throw new Error('Invalid credentials')
  if (!user.password) throw new Error('Please use Google login')

  const valid = await comparePassword(password, user.password)
  if (!valid) throw new Error('Invalid credentials')

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await user.update({ refreshToken })

  return { user, accessToken, refreshToken }
}

export const googleLogin = async (credential: string) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth is not configured on the server')
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token')
  }

  const email = payload.email
  const name = payload.name || email.split('@')[0]

  let user = await User.findOne({ where: { email } })

  if (!user) {
    const orgId = uuidv4()
    user = await User.create({
      email,
      name,
      orgId,
      role: 'admin',
      isVerified: true, 
      // no password since they use Google
    })
  }

  const jwtPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
  }

  const accessToken = generateAccessToken(jwtPayload)
  const refreshToken = generateRefreshToken(jwtPayload)

  await user.update({ refreshToken })

  return { user, accessToken, refreshToken }
}