export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTables, generateId } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api'
import { getDoc } from '@/lib/googleSheets'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { playerId, approved } = await req.json()
    if (!playerId) return errorResponse('playerId is required')

    const { tournaments, payments, notifications } = await getTables()
    const tRows = await tournaments.getRows()
    const tournament = tRows.find((r: any) => r.get('_id') === id)
    if (!tournament) return notFoundResponse('Tournament not found')

    const isHost = tournament.get('hostId') === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isHost && !isAdmin) return forbiddenResponse('Not authorized')

    let players = []
    try { players = JSON.parse(tournament.get('players') || '[]') } catch {}

    const playerIndex = players.findIndex((p: any) => String(p.playerId) === playerId)
    if (playerIndex === -1) return errorResponse('Player not found in tournament')

    players[playerIndex].paid = !!approved
    players[playerIndex].approved = !!approved
    players[playerIndex].paymentApproved = !!approved

    tournament.set('players', JSON.stringify(players))
    await tournament.save()

    // Update payment record
    const pRows = await payments.getRows()
    const payment = pRows.find((p: any) => p.get('playerId') === playerId && p.get('tournamentId') === id && p.get('type') === 'entryFee')
    if (payment) {
      payment.set('status', approved ? 'confirmed' : 'failed')
      await payment.save()
    }

    // Update Google Sheets payment record
    try {
      const doc = await getDoc()
      await doc.loadInfo()
      
      const paymentsSheet = doc.sheetsByTitle['Payments']
      if (paymentsSheet) {
        const sheetRows = await paymentsSheet.getRows()
        const sheetPayment = sheetRows.find((row: any) => 
          row.get('tournamentId') === id && 
          row.get('playerId') === playerId && 
          row.get('type') === 'payment'
        )
        
        if (sheetPayment) {
          sheetPayment.set('status', approved ? 'approved' : 'rejected')
          // Update notes to include approval info
          const currentNotes = sheetPayment.get('notes') || ''
          const approvalInfo = ` | ${approved ? 'APPROVED' : 'REJECTED'} on ${new Date().toISOString()}`
          sheetPayment.set('notes', currentNotes + approvalInfo)
          await sheetPayment.save()
          console.log('Payment status updated in Google Sheets:', {
            tournamentId: id,
            userId: playerId,
            status: approved ? 'approved' : 'rejected'
          })
        }
      }
    } catch (sheetsError) {
      console.error('Failed to update Google Sheets payment record:', sheetsError)
      // Continue even if Google Sheets fails
    }

    if (approved) {
      await notifications.addRow({
        _id: generateId(),
        type: 'payment_confirmed',
        userId: playerId,
        tournamentId: tournament.get('_id'),
        message: `Your payment for "${tournament.get('title')}" has been confirmed! You're all set.`,
        read: 'false',
        createdAt: new Date().toISOString()
      })
    }

    return successResponse({ message: `Player ${approved ? 'approved' : 'rejected'} successfully` })
  } catch (err) {
    console.error('Approve player error:', err)
    return errorResponse('Failed to update player status', 500)
  }
}
