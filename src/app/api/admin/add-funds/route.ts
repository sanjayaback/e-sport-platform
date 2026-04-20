import { NextRequest } from 'next/server'
import { getTables } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api'
import { validate, adminAddFundsSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return unauthorizedResponse()
    
    if (payload.role !== 'admin') {
      return forbiddenResponse('Only admins can add funds to other users')
    }

    const body = await req.json()
    const { value, error } = validate(adminAddFundsSchema, body)
    if (error) return errorResponse(error)

    const { userId, amount, paymentMethod, reason } = value as { 
      userId: string; 
      amount: number; 
      paymentMethod: string; 
      reason?: string 
    }

    if (amount <= 0) {
      return errorResponse('Amount must be greater than 0')
    }

    const { users, payments } = await getTables()
    
    // Get target user
    const userRows = await users.getRows()
    const targetUserRow = userRows.find((r: any) => String(r.get('_id')) === userId)
    
    if (!targetUserRow) return errorResponse('Target user not found', 404)

    // Add funds to target user's wallet
    const currentBalance = Number(targetUserRow.get('walletBalance') || 0)
    const newBalance = currentBalance + amount
    
    // Handle both mock and real database
    if (targetUserRow.set && targetUserRow.save) {
      targetUserRow.set('walletBalance', newBalance)
      await targetUserRow.save()
    } else {
      // Mock database - update the data directly
      const userData = targetUserRow.toObject()
      userData.walletBalance = newBalance
      
      // Update the mock storage
      const { users } = await getTables()
      const userRows = await users.getRows()
      const userIndex = userRows.findIndex((r: any) => String(r.get('_id')) === userId)
      if (userIndex !== -1) {
        userRows[userIndex].data = userData
      }
    }

    // Create payment record
    const paymentRecord = {
      _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      playerId: userId,
      amount: amount,
      status: 'completed',
      type: 'admin_deposit',
      timestamp: new Date().toISOString(),
      paymentMethod,
      reason: reason || 'Admin deposit',
      adminId: payload.userId
    }
    
    await payments.addRow(paymentRecord)

    return successResponse({ 
      message: 'Funds added successfully to user',
      targetUserId: userId,
      newBalance,
      amount,
      paymentMethod,
      reason
    })
    
  } catch (err) {
    return errorResponse('Failed to add funds', 500)
  }
}
