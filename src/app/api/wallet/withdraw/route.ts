import { NextRequest } from 'next/server'
import { getTables } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'
import { validate, withdrawSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return unauthorizedResponse()

    const body = await req.json()
    const { value, error } = validate(withdrawSchema, body)
    if (error) return errorResponse(error)

    const { amount, withdrawMethod } = value as { amount: number; withdrawMethod: string }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0')
    }

    const { users, payments } = await getTables()
    
    // Get user
    const userRows = await users.getRows()
    const userRow = userRows.find((r: any) => String(r.get('_id')) === payload.userId)
    
    if (!userRow) return errorResponse('User not found', 404)

    // Check balance
    const currentBalance = Number(userRow.get('walletBalance') || 0)
    if (currentBalance < amount) {
      return errorResponse('Insufficient balance', 402)
    }

    // Deduct from wallet
    const newBalance = currentBalance - amount
    userRow.set('walletBalance', newBalance)
    await userRow.save()

    // Create payment record (pending for admin approval)
    const paymentRecord = {
      _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      playerId: payload.userId,
      amount: amount,
      status: 'pending',
      type: 'withdrawal',
      timestamp: new Date().toISOString(),
      withdrawMethod
    }
    
    await payments.addRow(paymentRecord)

    return successResponse({ 
      message: 'Withdrawal request submitted successfully',
      newBalance,
      amount,
      withdrawMethod,
      status: 'pending'
    })
    
  } catch (err) {
    console.error('Withdraw error:', err)
    return errorResponse('Failed to process withdrawal', 500)
  }
}
