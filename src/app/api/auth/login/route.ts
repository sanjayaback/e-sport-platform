import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { validate, loginSchema } from '@/lib/validation'
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

    const { value, error } = validate(loginSchema, body)
    if (error) return errorResponse(error)

    const { email, password } = value as { email: string; password: string }

    const rows = await users.getRows()
    const userRow = rows.find(r => r.get('email') === email)
    
    if (!userRow) {
      return errorResponse('Invalid email or password', 401)
    }

    const isValid = await bcrypt.compare(password, userRow.get('password'))
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
