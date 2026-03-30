import jwt from 'jsonwebtoken'
import { IUser } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable in .env.local')
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function getUserFromHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    return verifyToken(token)
  } catch {
    return null
  }
}
