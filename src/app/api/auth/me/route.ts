export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('Authorization'))
    if (!payload?.userId) return errorResponse('Unauthorized', 401)

    const { users } = await getTables()
    const rows = await users.getRows()
    const userRow = rows.find(r => r.get('_id') === payload.userId)

    if (!userRow) return errorResponse('User not found', 404)

    const user = cleanRow(userRow)
    delete user.password // remove password from response

    return successResponse({ user })
  } catch (err) {
    console.error('Me error:', err)
    return errorResponse('Failed to get user', 500)
  }
}
