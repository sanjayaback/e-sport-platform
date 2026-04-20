export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTablesCached, invalidateCache } from '@/lib/db-cache'
import { cleanRow, generateId } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { validate, joinTournamentSchema } from '@/lib/validation'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api'
import { notifyPlayerJoined } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()
    if (payload.role !== 'player' && payload.role !== 'admin') {
      return forbiddenResponse('Only players can join tournaments')
    }

    const body = await req.json()
    const { value, error } = validate(joinTournamentSchema, body)
    if (error) return errorResponse(error)

    const { gameID, paymentScreenshot } = value as { gameID: string; paymentScreenshot?: string }

    const { tournaments, payments, notifications, users } = await getTablesCached()
    if (!tournaments || !payments || !notifications || !users) {
      return errorResponse('Database not available', 500)
    }
    const tRows = await tournaments.getRows()
    const tournament = tRows.find((r: any) => r.get('_id') === id)
    
    if (!tournament) return notFoundResponse('Tournament not found')
    if (tournament.get('status') !== 'upcoming') return errorResponse('Tournament is not open for joining')

    let players = []
    try { players = JSON.parse(tournament.get('players') || '[]') } catch {}

    const maxPlayers = Number(tournament.get('maxPlayers') || 0)
    if (players.length >= maxPlayers) return errorResponse('Tournament is full')

    const alreadyJoined = players.some((p: any) => String(p.playerId) === payload.userId)
    if (alreadyJoined) return errorResponse('You have already joined this tournament')

    const entryFee = Number(tournament.get('entryFee') || 0)
    if (entryFee > 0 && !paymentScreenshot) {
      return errorResponse('Payment screenshot is required for paid tournaments')
    }

    players.push({
      playerId: payload.userId,
      gameID,
      paid: false,
      approved: false,
      paymentScreenshot: paymentScreenshot || null,
      paymentApproved: false,
      joinedAt: new Date().toISOString(),
    })

    tournament.set('players', JSON.stringify(players))
    await tournament.save()
    if (entryFee > 0) {
      await payments.addRow({
        _id: generateId(),
        playerId: payload.userId,
        tournamentId: tournament.get('_id'),
        amount: entryFee,
        status: 'pending',
        type: 'entryFee',
        timestamp: new Date().toISOString()
      })
    }

    // Get user details
    const uRows = await users.getRows()
    const playerRow = uRows.find((u: any) => u.get('_id') === payload.userId)
    const hostRow = uRows.find((u: any) => u.get('_id') === tournament.get('hostId'))

    await notifications.addRow({
      _id: generateId(),
      type: 'player_joined',
      userId: tournament.get('hostId'),
      tournamentId: tournament.get('_id'),
      message: `${playerRow?.get('username')} joined your tournament "${tournament.get('title')}"`,
      read: 'false',
      createdAt: new Date().toISOString()
    })

    await notifications.addRow({
      _id: generateId(),
      type: 'player_joined',
      userId: payload.userId,
      tournamentId: tournament.get('_id'),
      message: `You joined "${tournament.get('title')}". Pay entry fee using the host's QR code.`,
      read: 'false',
      createdAt: new Date().toISOString()
    })

    await notifyPlayerJoined({
      playerEmail: playerRow?.get('email') || '',
      playerUsername: playerRow?.get('username') || '',
      tournamentTitle: tournament.get('title'),
      hostEmail: hostRow?.get('email'),
    })

    return successResponse({ message: 'Successfully joined tournament' })
  } catch (err) {
    console.error('Join tournament error:', err)
    invalidateCache()
    return errorResponse('Failed to join tournament', 500)
  }
}
