import { NextRequest } from 'next/server'
import { getTables } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'
import { validate, addFundsSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return unauthorizedResponse()

    const body = await req.json()
    const { value, error } = validate(addFundsSchema, body)
    if (error) return errorResponse(error)

    const { amount, paymentMethod } = value as { amount: number; paymentMethod: string }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0')
    }

    const { users, payments } = await getTables()
    
    // Get user
    const userRows = await users.getRows()
    const userRow = userRows.find((r: any) => String(r.get('_id')) === payload.userId)
    
    if (!userRow) return errorResponse('User not found', 404)

    // Add funds to wallet
    const currentBalance = Number(userRow.get('walletBalance') || 0)
    const newBalance = currentBalance + amount
    userRow.set('walletBalance', newBalance)
    await userRow.save()

    // Create payment record
    const paymentRecord = {
      _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      playerId: payload.userId,
      amount: amount,
      status: 'completed',
      type: 'deposit',
      timestamp: new Date().toISOString(),
      paymentMethod
    }
    
    await payments.addRow(paymentRecord)

    return successResponse({ 
      message: 'Funds added successfully',
      newBalance,
      amount,
      paymentMethod
    })
    
  } catch (err) {
    console.error('Add funds error:', err)
    return errorResponse('Failed to add funds', 500)
  }
}
