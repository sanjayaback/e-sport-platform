import { NextRequest } from 'next/server'
import { getTables, cleanRow } from '@/lib/db'
import { getUserFromHeader } from '@/lib/jwt'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { notifications } = await getTables()
    const rows = await notifications.getRows()

    let results = rows.map((r: any) => cleanRow(r)).filter((n: any) => String(n.userId) === payload.userId)
    
    // Convert string 'false'/'true' to boolean
    results = results.map((n: any) => ({ ...n, read: n.read === 'true' }))

    results.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    results = results.slice(0, 50)

    const unreadCount = results.filter((n: any) => !n.read).length

    return successResponse({ notifications: results, unreadCount })
  } catch (err) {
    console.error('Get notifications error:', err)
    return errorResponse('Failed to fetch notifications', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromHeader(req.headers.get('authorization'))
    if (!payload) return unauthorizedResponse()

    const { ids, markAll } = await req.json()
    const { notifications } = await getTables()
    const rows = await notifications.getRows()

    let modified = false;

    for (const row of rows) {
      if (row.get('userId') === payload.userId) {
        if (markAll || (ids && ids.includes(row.get('_id')))) {
          row.set('read', 'true')
          await row.save()
          modified = true;
        }
      }
    }

    return successResponse({ message: 'Notifications marked as read' })
  } catch (err) {
    console.error('Update notifications error:', err)
    return errorResponse('Failed to update notifications', 500)
  }
}
