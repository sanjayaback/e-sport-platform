import { NextRequest } from 'next/server'
import { getTables, generateId } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { validate, registerSchema } from '@/lib/validation'
import { successResponse, errorResponse } from '@/lib/api'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { users } = await getTables()
    if (!users) {
      console.error('DATABASE ERROR: "Users" sheet NOT FOUND. Verify sector config.')
      return errorResponse('Database node "Users" not identified. Contact administrator.')
    }
    const body = await req.json()

    const { value, error } = validate(registerSchema, body)
    if (error) return errorResponse(error)

    const { username, email, password, role } = value as {
      username: string; email: string; password: string; role: string
    }

    const rows = await users.getRows()
    const existing = rows.find(r => r.get('email') === email || r.get('username') === username)
    
    if (existing) {
      return errorResponse(
        existing.get('email') === email ? 'Email already registered' : 'Username already taken'
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = {
      _id: generateId(),
      username,
      email,
      password: hashedPassword,
      role,
      walletBalance: 0,
      isSubscribed: 'false',
      createdAt: new Date().toISOString()
    }
    
    await users.addRow(newUser)

    const token = signToken({ userId: newUser._id, email: newUser.email, role: newUser.role })

    return successResponse({ token, user: newUser }, 201)
  } catch (err) {
    console.error('Register error:', err)
    return errorResponse('Registration failed', 500)
  }
}
