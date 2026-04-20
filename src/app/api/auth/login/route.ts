import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { validate, loginSchema } from '@/lib/validation'
import { successResponse, errorResponse } from '@/lib/api'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const { users } = await getTables()
    if (!users) {
      console.error('DATABASE ERROR: "Users" sheet NOT FOUND. Verify sector config.')
      return errorResponse('Database node "Users" not identified. Contact administrator.')
    }
    const body = await req.json()

    const { value, error } = validate(loginSchema, body)
    if (error) return errorResponse(error)

    const { email, password } = value as { email: string; password: string }

    const rows = await users.getRows()
    if (isDevelopment) {
      console.log('[DEBUG] Available users:', rows.map((r: any) => ({ email: r.get('email'), role: r.get('role') })))
    }
    const userRow = rows.find((r: any) => r.get('email') === email)
    if (isDevelopment) {
      console.log('[DEBUG] Found user:', userRow ? { email: userRow.get('email'), role: userRow.get('role') } : null)
    }
    
    if (!userRow) {
      return errorResponse('Invalid email or password', 401)
    }

    // Development mode: bypass password check for mock users
    const storedPassword = userRow.get('password')
    const isDevMode = isDevelopment && storedPassword.includes('dummy.hash.for.development')
    
    if (isDevelopment) {
      console.log('[DEBUG] Password validation mode:', {
        isDevMode,
        nodeEnv: process.env.NODE_ENV,
      })
    }
    
    let isValid = false
    if (isDevMode) {
      isValid = password === 'password' // Allow 'password' for dev users
      if (isDevelopment) {
        console.log('[DEBUG] Dev mode password check:', isValid)
      }
    } else {
      isValid = await bcrypt.compare(password, storedPassword)
      if (isDevelopment) {
        console.log('[DEBUG] Bcrypt password check:', isValid)
      }
    }
    
    if (isDevelopment) {
      console.log('[DEBUG] Final validation result:', isValid)
    }
    
    if (!isValid) {
      return errorResponse('Invalid email or password', 401)
    }

    const user = cleanRow(userRow)
    delete user.password // don't send back password

    const token = signToken({ userId: user._id, email: user.email, role: user.role })

    return successResponse({ token, user })
  } catch (err) {
    console.error('Login error:', err)
    return errorResponse('Login failed', 500)
  }
}
