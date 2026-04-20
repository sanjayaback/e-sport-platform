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

    let results = rows.map((r: any) => cleanRow(r))
    
    // Parse JSON fields
    results = results.map((t: any) => {
      try { t.players = JSON.parse(t.players || '[]') } catch { t.players = [] }
      return t
    })

    if (game && game !== 'All') {
      results = results.filter((t: any) => t.gameName === game)
    }
    if (status) {
      results = results.filter((t: any) => t.status === status)
    }
    
    // Sort by createdAt descending
    results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    const total = results.length
    const pages = Math.ceil(total / limit) || 1
    const page = parseInt(searchParams.get('page') || '1')
    const startIndex = (page - 1) * limit
    
    // Limits
    results = results.slice(startIndex, startIndex + limit)
    
    // Populate host info
    results = results.map((t: any) => {
      const hStr = String(t.hostId)
      const host = userRows.find((u: any) => String(u.get('_id')) === String(t.hostId))
      if (host) {
        t.hostId = { _id: host.get('_id'), username: host.get('username') }
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
    
    // Check user wallet balance for prize pool
    const uRows = await users.getRows()
    const userRow = uRows.find((u: any) => String(u.get('_id')) === payload.userId)
    if (!userRow) {
      return errorResponse('User not found', 404)
    }
    
    const userWalletBalance = parseFloat(userRow.get('walletBalance') || '0')

    const body = await req.json()

    const { value, error } = validate(tournamentSchema, body) as { value: any, error: any }
    if (error) return errorResponse(error)

    // Add Rs.50 host fee per tournament
    const hostFee = 50;
    const totalRequired = value.prizePool + hostFee;
    
    // Check if user has sufficient wallet balance for prize pool + host fee
    if (userWalletBalance < totalRequired) {
      return errorResponse(`Insufficient wallet balance. Required: Rs.${totalRequired} (Prize Pool: Rs.${value.prizePool} + Host Fee: Rs.${hostFee}), Available: Rs.${userWalletBalance}`, 400)
    }

    // Deduct prize pool + host fee from user wallet
    const updatedWalletBalance = userWalletBalance - totalRequired
    
    // Update user wallet balance
    userRow.set('walletBalance', updatedWalletBalance)
    await userRow.save()
    
    // Prepare payment record for tournament creation
    const { payments } = await getTables()
    const paymentRecord = {
      _id: generateId(),
      playerId: payload.userId,
      tournamentId: '', // Will be set after tournament creation
      amount: totalRequired,
      status: 'completed',
      type: 'payout',
      timestamp: new Date().toISOString(),
      description: `Tournament creation: ${value.title} (Prize Pool: Rs.${value.prizePool} + Host Fee: Rs.${hostFee})`
    }

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
      roomId: value.roomId || '',
      roomPassword: value.roomPassword || '',
      scheduledAt: value.scheduledAt,
      createdAt: new Date().toISOString()
    }

    await tournaments.addRow(newTournament)
    
    // Update payment record with tournament ID
    paymentRecord.tournamentId = newTournament._id
    await payments.addRow(paymentRecord)

    return successResponse({ tournament: newTournament, newBalance: updatedWalletBalance }, 201)
  } catch (err) {
    console.error('Create tournament error:', err)
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
    return errorResponse('Failed to create tournament', 500)
  }
}
