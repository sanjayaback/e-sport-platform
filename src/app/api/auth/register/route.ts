import { NextRequest } from 'next/server'
import { getTablesCached, checkUserExists, invalidateCache } from '@/lib/db-cache'
import { generateId } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { validate, registerSchema } from '@/lib/validation'
import { successResponse, errorResponse } from '@/lib/api'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    console.log(`[${Date.now() - startTime}ms] Request parsed`)

    const { value, error } = validate(registerSchema, body)
    if (error) return errorResponse(error)
    console.log(`[${Date.now() - startTime}ms] Validation completed`)

    const { username, email, password, role } = value as {
      username: string; email: string; password: string; role: string
    }

    // Parallel operations: check user existence and hash password
    const [userExists, hashedPassword] = await Promise.all([
      checkUserExists(email, username),
      bcrypt.hash(password, 10) // Reduced rounds from 12 to 10 for speed
    ])
    console.log(`[${Date.now() - startTime}ms] User check and password hash completed`)
    
    if (userExists) {
      const { users } = await getTablesCached()
      const rows = await users.getRows()
      const existing = rows.find((r: any) => r.get('email') === email || r.get('username') === username)
      
      return errorResponse(
        existing?.get('email') === email ? 'Email already registered' : 'Username already taken'
      )
    }

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

    // Add user to database
    const { users } = await getTablesCached()
    if (!users) {
      console.error('DATABASE ERROR: "Users" sheet NOT FOUND. Verify sector config.')
      return errorResponse('Database node "Users" not identified. Contact administrator.')
    }
    
    await users.addRow(newUser)
    console.log(`[${Date.now() - startTime}ms] User added to database`)

    // Generate token (fast operation)
    const token = signToken({ userId: newUser._id, email: newUser.email, role: newUser.role })
    
    console.log(`[${Date.now() - startTime}ms] Registration completed successfully`)
    return successResponse({ token, user: newUser }, 201)
  } catch (err) {
    console.error(`[${Date.now() - startTime}ms] Register error:`, err)
    invalidateCache() // Clear cache on error
    return errorResponse('Registration failed', 500)
  }
}
