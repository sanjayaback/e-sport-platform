export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTablesCached, invalidateCache } from '@/lib/db-cache'
import { generateId } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { validate, screenshotSchema } from '@/lib/validation'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const body = await req.json()
    const { value, error } = validate(screenshotSchema, body)
    if (error) return errorResponse(error)
    const { screenshotURL } = value as { screenshotURL: string }

    // Validate that screenshotURL is a proper Cloudinary URL
    if (!screenshotURL.startsWith('https://res.cloudinary.com/')) {
      return errorResponse('Invalid screenshot URL format')
    }

    const { tournaments, notifications, users } = await getTablesCached()
    if (!tournaments || !notifications || !users) {
      return errorResponse('Database not available', 500)
    }

    const tRows = await tournaments.getRows()
    const tournament = tRows.find((r: any) => r.get('_id') === id)
    if (!tournament) return notFoundResponse('Tournament not found')

    let players = []
    try { players = JSON.parse(tournament.get('players') || '[]') } catch {}

    const playerIndex = players.findIndex((p: any) => String(p.playerId) === payload.userId)
    if (playerIndex === -1) return errorResponse('You are not in this tournament')

    players[playerIndex].screenshotURL = screenshotURL
    tournament.set('players', JSON.stringify(players))
    await tournament.save()

    // Notify host
    const uRows = await users.getRows()
    const playerRecord = uRows.find((u: any) => String(u.get('_id')) === payload.userId)

    await notifications.addRow({
      _id: generateId(),
      type: 'screenshot_submitted',
      userId: tournament.get('hostId'),
      tournamentId: tournament.get('_id'),
      message: `${playerRecord?.get('username') || 'A player'} submitted a screenshot for "${tournament.get('title')}"`,
      read: 'false',
      createdAt: new Date().toISOString()
    })

    return successResponse({ message: 'Screenshot submitted successfully' })
  } catch (err) {
    console.error('Screenshot submission error:', err)
    invalidateCache() // Clear cache on error
    return errorResponse('Failed to submit screenshot', 500)
  }
}
