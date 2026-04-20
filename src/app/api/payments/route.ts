import { NextRequest } from 'next/server'
import { getTables, cleanRow, generateId } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { searchParams } = new URL(req.url)
    const tournamentId = searchParams.get('tournamentId')

    const { payments, users, tournaments } = await getTables()
    const pRows = await payments.getRows()
    const uRows = await users.getRows()
    const tRows = await tournaments.getRows()

    let results = pRows.map((r: any) => cleanRow(r))

    // filter logic
    if (payload.role !== 'admin') {
      results = results.filter((p: any) => p.playerId === payload.userId)
    }
    if (tournamentId) {
      results = results.filter((p: any) => p.tournamentId === tournamentId)
    }

    // sort
    results.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // populate
    results = results.map((p: any) => {
      const u = uRows.find((u: any) => u.get('_id') === String(p.playerId))
      if (u) p.playerId = { _id: u.get('_id'), username: u.get('username'), email: u.get('email') }
      
      const t = tRows.find((t: any) => String(t.get('_id')) === p.tournamentId)
      if (t) p.tournamentId = { _id: t.get('_id'), title: t.get('title'), gameName: t.get('gameName') }
      
      return p
    })

    return successResponse({ payments: results })
  } catch (err) {
    console.error('Get payments error:', err)
    return errorResponse('Failed to fetch payments', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload?.userId) return unauthorizedResponse()

    const { type, amount } = await req.json()
    if (!type || !amount) return errorResponse('Type and amount are required')
    
    const { payments, users, notifications, tournaments } = await getTables()
    const uRows = await users.getRows()
    const user = uRows.find((u: any) => String(u.get('_id')) === payload.userId)
    if (!user) return notFoundResponse('User not found')

    const currentBalance = Number(user.get('walletBalance') || 0)
    const transactionAmount = Number(amount)

    if (type === 'withdraw') {
      if (currentBalance < transactionAmount) {
        return errorResponse('Insufficient balance in wallet node')
      }
      // Deduct immediately for security
      user.set('walletBalance', (currentBalance - transactionAmount).toFixed(2))
      await user.save()
    }

    const newPayment = {
      _id: generateId(),
      playerId: payload.userId,
      amount: transactionAmount,
      status: 'pending',
      type: type, // 'deposit' or 'withdraw'
      timestamp: new Date().toISOString()
    }

    await payments.addRow(newPayment)

    // Notify Admin
    await notifications.addRow({
      _id: generateId(),
      type: 'payment_pending',
      userId: 'admin', // Global admin notice
      message: `New ${type} request of $${amount} from ${user.get('username')}`,
      read: 'false',
      createdAt: new Date().toISOString()
    })

    return successResponse({ payment: newPayment }, 201)
  } catch (err) {
    console.error('Create payment error:', err)
    return errorResponse('Failed to process financial request', 500)
  }
}
