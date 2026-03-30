export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTables, generateId } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()
    if (payload.role !== 'admin') return forbiddenResponse('Only global commanders can finalize financial nodes')

    const { status } = await req.json() // 'confirmed' or 'failed'
    if (!status) return errorResponse('Status is required')

    const { payments, users, notifications } = await getTables()
    const pRows = await payments.getRows()
    const payment = pRows.find(r => r.get('_id') === params.id)
    if (!payment) return notFoundResponse('Financial node not found')

    if (payment.get('status') !== 'pending') {
      return errorResponse('Transaction already finalized')
    }

    const type = payment.get('type') // 'deposit' or 'withdraw'
    const amount = Number(payment.get('amount'))
    const playerId = payment.get('playerId')

    const uRows = await users.getRows()
    const user = uRows.find(u => u.get('_id') === playerId)
    if (!user) return notFoundResponse('User profile not found')

    const currentBalance = Number(user.get('walletBalance') || 0)

    if (status === 'confirmed') {
      if (type === 'deposit') {
        user.set('walletBalance', (currentBalance + amount).toFixed(2))
        await user.save()
      }
      // Withdrawal was already deducted in the POST route
    } else if (status === 'failed') {
      if (type === 'withdraw') {
        // Refund withdrawal if failed
        user.set('walletBalance', (currentBalance + amount).toFixed(2))
        await user.save()
      }
    }

    payment.set('status', status)
    await payment.save()

    // Notify User
    await notifications.addRow({
      _id: generateId(),
      type: 'payment_update',
      userId: playerId,
      message: `Your ${type} of $${amount} has been ${status === 'confirmed' ? 'APPROVED' : 'REJECTED'} by command.`,
      read: 'false',
      createdAt: new Date().toISOString()
    })

    return successResponse({ message: `Transaction ${status} successfully` })
  } catch (err) {
    console.error('Approve payment error:', err)
    return errorResponse('Failed to finalize financial node', 500)
  }
}
