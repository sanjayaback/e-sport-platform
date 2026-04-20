import { NextRequest } from 'next/server'
import { getTables } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return unauthorizedResponse()
    
    if (payload.role !== 'host' && payload.role !== 'admin') {
      return forbiddenResponse('Only hosts can subscribe')
    }

    const { users } = await getTables()
    const rows = await users.getRows()
    const userRow = rows.find((r: any) => String(r.get('_id')) === payload.userId)
    
    if (!userRow) return errorResponse('User not found', 404)

    if (userRow.get('isSubscribed') === 'true') {
      return errorResponse('You are already subscribed', 400)
    }

    const balance = Number(userRow.get('walletBalance') || 0)
    
    // Configurable subscription price
    const SUBSCRIPTION_PRICE = 10 
    
    if (balance < SUBSCRIPTION_PRICE) {
      return errorResponse(`Insufficient wallet balance. Subscription costs $${SUBSCRIPTION_PRICE}.`, 402)
    }

    // Deduct balance and update subscription
    userRow.set('walletBalance', balance - SUBSCRIPTION_PRICE)
    userRow.set('isSubscribed', 'true')
    await userRow.save()

    return successResponse({ 
      message: 'Subscription successful',
      newBalance: balance - SUBSCRIPTION_PRICE,
      isSubscribed: true
    })
    
  } catch (err) {
    console.error('Subscription error:', err)
    return errorResponse('Failed to process subscription', 500)
  }
}
