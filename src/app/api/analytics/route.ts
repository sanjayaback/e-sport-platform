import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()
    if (payload.role !== 'host' && payload.role !== 'admin') {
      return forbiddenResponse('Analytics only available for hosts and admins')
    }

    const { tournaments, users, payments } = await getTables()
    const tRows = await tournaments.getRows()
    const uRows = await users.getRows()
    const pRows = await payments.getRows()

    let allTournaments = tRows.map((r: any) => cleanRow(r))
    allTournaments = allTournaments.map((t: any) => {
      try { t.players = JSON.parse(t.players || '[]') } catch { t.players = [] }
      return t
    })

    if (payload.role === 'host') {
      allTournaments = allTournaments.filter((t: any) => t.hostId === payload.userId)
    }

    const totalUsers = uRows.length

    let allPayments = pRows.map((r: any) => cleanRow(r))
    if (payload.role === 'admin') {
      allPayments = allPayments.filter((p: any) => p.status === 'confirmed')
    }

    // Per-game stats
    const gameMap: Record<string, { count: number; players: number; prizePool: number }> = {}
    for (const t of allTournaments) {
      if (!gameMap[t.gameName]) gameMap[t.gameName] = { count: 0, players: 0, prizePool: 0 }
      gameMap[t.gameName].count += 1
      gameMap[t.gameName].players += t.players.length
      gameMap[t.gameName].prizePool += Number(t.prizePool)
    }

    const perGameStats = Object.keys(gameMap).map(game => ({ game, ...gameMap[game] }))

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyMap: Record<string, number> = {}
    for (const p of allPayments) {
      if (p.type === 'entryFee' && p.status === 'confirmed' && new Date(p.timestamp) >= sixMonthsAgo) {
        const month = new Date(p.timestamp).toLocaleString('default', { month: 'short', year: '2-digit' })
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(p.amount)
      }
    }
    const monthlyRevenue = Object.keys(monthlyMap).map(month => ({ month, revenue: monthlyMap[month] }))

    const totalPlayers = allTournaments.reduce((sum: number, t: any) => sum + t.players.length, 0)
    const totalPrizePool = allTournaments.reduce((sum: number, t: any) => sum + Number(t.prizePool), 0)
    const totalRevenue = allPayments
      .filter((p: any) => p.type === 'entryFee' && p.status === 'confirmed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    return successResponse({
      totalTournaments: allTournaments.length,
      totalPlayers: payload.role === 'admin' ? totalUsers : totalPlayers,
      totalPrizePool,
      totalRevenue,
      perGameStats,
      monthlyRevenue,
      recentTournaments: allTournaments.slice(0, 5),
    })
  } catch (err) {
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
    return errorResponse('Failed to fetch analytics', 500)
  }
}
