export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { validate, tournamentUpdateSchema } from '@/lib/validation'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api'
import { notifyWinnerSelected } from '@/lib/notifications'
import { generateId } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { tournaments, users } = await getTables()
    const tRows = await tournaments.getRows()
    const uRows = await users.getRows()

    const tRow = tRows.find(r => r.get('_id') === params.id)
    if (!tRow) return notFoundResponse('Tournament not found')
    
    const tournament = cleanRow(tRow)
    try { tournament.players = JSON.parse(tournament.players || '[]') } catch { tournament.players = [] }

    // Populate Host
    const hStr = String(tournament.hostId)
    const host = uRows.find(u => String(u.get('_id')) === hStr)
    if (host) tournament.hostId = { _id: host.get('_id'), username: host.get('username'), email: host.get('email') }

    // Populate Winner
    if (tournament.winnerId) {
      const wStr = String(tournament.winnerId)
      const winner = uRows.find(u => String(u.get('_id')) === wStr)
      if (winner) tournament.winnerId = { _id: winner.get('_id'), username: winner.get('username') }
    }

    // Populate Players
    tournament.players = tournament.players.map((p: any) => {
      const pStr = String(p.playerId)
      const pu = uRows.find(u => String(u.get('_id')) === pStr)
      if (pu) {
        return { ...p, playerId: { _id: pu.get('_id'), username: pu.get('username'), email: pu.get('email') } }
      }
      return p
    })

    return successResponse({ tournament })
  } catch (err) {
    console.error('Get tournament error:', err)
    return errorResponse('Failed to fetch tournament', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { tournaments, users, notifications } = await getTables()
    const tRows = await tournaments.getRows()
    const tRow = tRows.find(r => r.get('_id') === params.id)
    if (!tRow) return notFoundResponse('Tournament not found')

    const isHost = tRow.get('hostId') === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isHost && !isAdmin) return forbiddenResponse('Not authorized to update this tournament')

    const body = await req.json()
    const { value, error } = validate(tournamentUpdateSchema, body)
    if (error) return errorResponse(error)

    const updates = value as any
    const uRows = await users.getRows()

    // Handle winner selection
    if (updates.winnerId && updates.winnerId !== tRow.get('winnerId')) {
      const winnerRow = uRows.find(u => u.get('_id') === String(updates.winnerId))
      if (!winnerRow) return errorResponse('Winner not found')

      // Notify winner
      await notifications.addRow({
        _id: generateId(),
        type: 'winner_selected',
        userId: updates.winnerId,
        tournamentId: tRow.get('_id'),
        message: `Congratulations! You won "${tRow.get('title')}"! Prize: $${tRow.get('prizePool')}`,
        read: 'false',
        createdAt: new Date().toISOString()
      })

      // Notify all players
      let players = []
      try { players = JSON.parse(tRow.get('players') || '[]') } catch {}
      
      for (const player of players) {
        if (String(player.playerId) !== String(updates.winnerId)) {
          await notifications.addRow({
            _id: generateId(),
            type: 'winner_selected',
            userId: player.playerId,
            tournamentId: tRow.get('_id'),
            message: `Winner announced for "${tRow.get('title')}": ${winnerRow.get('username')}`,
            read: 'false',
            createdAt: new Date().toISOString()
          })
        }
      }

      // Update Winner Wallet Balance
      const currentBalance = Number(winnerRow.get('walletBalance') || 0)
      const prizePool = Number(tRow.get('prizePool') || 0)
      winnerRow.set('walletBalance', currentBalance + prizePool)
      await winnerRow.save()

      await notifyWinnerSelected({
        winnerEmail: winnerRow.get('email'),
        winnerUsername: winnerRow.get('username'),
        tournamentTitle: tRow.get('title'),
        prizePool: Number(tRow.get('prizePool')),
      })

      updates.status = 'finished'
    }

    // Apply updates
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) tRow.set(k, v)
    }
    await tRow.save()

    // Return updated
    return successResponse({ message: 'Update success' })
  } catch (err) {
    console.error('Update tournament error:', err)
    return errorResponse('Failed to update tournament', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { tournaments } = await getTables()
    const tRows = await tournaments.getRows()
    const tRow = tRows.find(r => r.get('_id') === params.id)
    if (!tRow) return notFoundResponse('Tournament not found')

    const isHost = tRow.get('hostId') === payload.userId
    const isAdmin = payload.role === 'admin'
    if (!isHost && !isAdmin) return forbiddenResponse('Not authorized to delete this tournament')

    if (tRow.get('status') !== 'upcoming') {
      return errorResponse('Can only delete upcoming tournaments')
    }

    await tRow.delete()
    return successResponse({ message: 'Tournament deleted successfully' })
  } catch (err) {
    console.error('Delete tournament error:', err)
    return errorResponse('Failed to delete tournament', 500)
  }
}
