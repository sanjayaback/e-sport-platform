import { NextRequest, NextResponse } from 'next/server'
import { getTables } from '@/lib/db'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const { users } = await getTables()
    if (!users) {
      return NextResponse.json({ error: 'Users sheet not found' }, { status: 404 })
    }

    const rows = await users.getRows()
    const usersData = rows.map((row: any) => ({
      id: row.get('_id'),
      username: row.get('username'),
      email: row.get('email'),
      role: row.get('role'),
      walletBalance: row.get('walletBalance'),
      isSubscribed: row.get('isSubscribed'),
      createdAt: row.get('createdAt')
    }))

    return NextResponse.json({
      success: true,
      count: usersData.length,
      users: usersData
    })
  } catch (error) {
    console.error('Google Sheets test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
