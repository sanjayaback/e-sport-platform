import { NextRequest } from 'next/server'
import { getTables, generateId, cleanRow } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { validate, tournamentSchema } from '@/lib/validation'
import { successResponse, errorResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const game = searchParams.get('game')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    const { tournaments, users } = await getTables()
    const rows = await tournaments.getRows()
    const userRows = await users.getRows()

    let results = rows.map(r => cleanRow(r))
    
    // Parse JSON fields
    results = results.map(t => {
      try { t.players = JSON.parse(t.players || '[]') } catch { t.players = [] }
      return t
    })

    if (game && game !== 'All') {
      results = results.filter(t => t.gameName === game)
    }
    if (status) {
      results = results.filter(t => t.status === status)
    }
    
    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    const total = results.length
    const pages = Math.ceil(total / limit) || 1
    const page = parseInt(searchParams.get('page') || '1')
    const startIndex = (page - 1) * limit
    
    // Limits
    results = results.slice(startIndex, startIndex + limit)
    
    // Populate host info
    results = results.map(t => {
      const hStr = String(t.hostId)
      const u = userRows.find(u => String(u.get('_id')) === hStr)
      if (u) {
        t.hostId = { _id: u.get('_id'), username: u.get('username') }
      }
      return t
    })

    return successResponse({ tournaments: results, total, pages })
  } catch (err) {
    console.error('List tournaments error:', err)
    return errorResponse('Failed to fetch tournaments', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId || (payload.role !== 'host' && payload.role !== 'admin')) {
      return errorResponse('Forbidden: Only hosts can create tournaments', 403)
    }

    const { tournaments, users } = await getTables()
    
    if (payload.role !== 'admin') {
      const uRows = await users.getRows()
      const hostUser = uRows.find(u => String(u.get('_id')) === payload.userId)
      if (!hostUser || hostUser.get('isSubscribed') !== 'true') {
        return errorResponse('Host subscription required to create tournaments', 403)
      }
    }

    const body = await req.json()

    const { value, error } = validate(tournamentSchema, body) as { value: any, error: any }
    if (error) return errorResponse(error)

    const newTournament = {
      _id: generateId(),
      hostId: payload.userId,
      title: value.title,
      description: value.description || '',
      gameName: value.gameName,
      entryFee: value.entryFee,
      maxPlayers: value.maxPlayers,
      prizePool: value.prizePool,
      status: 'upcoming',
      players: '[]',
      hostQRCodeURL: value.hostQRCodeURL || '',
      scheduledAt: value.scheduledAt,
      createdAt: new Date().toISOString()
    }

    await tournaments.addRow(newTournament)

    return successResponse({ tournament: newTournament }, 201)
  } catch (err) {
    console.error('Create tournament error:', err)
    return errorResponse('Failed to create tournament', 500)
  }
}
