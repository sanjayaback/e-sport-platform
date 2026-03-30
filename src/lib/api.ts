import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status })
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}

export function notFoundResponse(message = 'Not found') {
  return NextResponse.json({ success: false, error: message }, { status: 404 })
}
