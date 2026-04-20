import { NextRequest } from 'next/server'
import { getTables } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return unauthorizedResponse()

    const { users, payments, tournaments } = await getTables()
    
    // Get user data
    const userRows = await users.getRows()
    const userRow = userRows.find((r: any) => String(r.get('_id')) === payload.userId)
    
    if (!userRow) return errorResponse('User not found', 404)

    // Get user's payment history
    const paymentRows = await payments.getRows()
    const userPayments = paymentRows
      .filter((r: any) => String(r.get('playerId')) === payload.userId)
      .map((r: any) => ({
        _id: r.get('_id'),
        tournamentId: r.get('tournamentId'),
        amount: Number(r.get('amount') || 0),
        status: r.get('status'),
        type: r.get('type'),
        timestamp: r.get('timestamp')
      }))
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Get user's tournament participation
    const tournamentRows = await tournaments.getRows()
    const userTournaments = tournamentRows
      .filter((r: any) => {
        const players = JSON.parse(r.get('players') || '[]')
        return players.some((p: any) => String(p.playerId) === payload.userId)
      })
      .map((r: any) => ({
        _id: r.get('_id'),
        title: r.get('title'),
        gameName: r.get('gameName'),
        entryFee: Number(r.get('entryFee') || 0),
        status: r.get('status'),
        winnerId: r.get('winnerId'),
        scheduledAt: r.get('scheduledAt'),
        createdAt: r.get('createdAt')
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Get tournaments hosted by user (if host)
    let hostedTournaments = []
    if (payload.role === 'host' || payload.role === 'admin') {
      hostedTournaments = tournamentRows
        .filter((r: any) => String(r.get('hostId')) === payload.userId)
        .map((r: any) => ({
          _id: r.get('_id'),
          title: r.get('title'),
          gameName: r.get('gameName'),
          entryFee: Number(r.get('entryFee') || 0),
          maxPlayers: Number(r.get('maxPlayers') || 0),
          prizePool: Number(r.get('prizePool') || 0),
          status: r.get('status'),
          scheduledAt: r.get('scheduledAt'),
          createdAt: r.get('createdAt')
        }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    // Calculate statistics
    const totalSpent = userPayments
      .filter((p: any) => p.type === 'entry_fee' && p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const totalWinnings = userPayments
      .filter((p: any) => p.type === 'winnings' && p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const totalDeposits = userPayments
      .filter((p: any) => p.type === 'deposit' && p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount, 0)

    const tournamentsPlayed = userTournaments.length
    const tournamentsWon = userTournaments.filter((t: any) => t.winnerId === payload.userId).length
    const tournamentsHosted = hostedTournaments.length

    const profileData = {
      user: {
        _id: userRow.get('_id'),
        username: userRow.get('username'),
        email: userRow.get('email'),
        role: userRow.get('role'),
        walletBalance: Number(userRow.get('walletBalance') || 0),
        isSubscribed: userRow.get('isSubscribed') === 'true',
        createdAt: userRow.get('createdAt')
      },
      statistics: {
        totalSpent,
        totalWinnings,
        totalDeposits,
        tournamentsPlayed,
        tournamentsWon,
        tournamentsHosted,
        winRate: tournamentsPlayed > 0 ? Math.round((tournamentsWon / tournamentsPlayed) * 100) : 0
      },
      financials: {
        payments: userPayments,
        totalTransactions: userPayments.length
      },
      activity: {
        participatedTournaments: userTournaments,
        hostedTournaments,
        totalActivity: userTournaments.length + hostedTournaments.length
      }
    }

    return successResponse(profileData)
    
  } catch (err) {
    console.error('Profile fetch error:', err)
    return errorResponse('Failed to fetch profile data', 500)
  }
}
