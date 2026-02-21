import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Send a successful API response
 */
export function sendSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  )
}

/**
 * Send an error API response
 */
export function sendError(error: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error },
    { status }
  )
}

/**
 * Send a success message (for DELETE, etc.)
 */
export function sendMessage(message: string, status: number = 200) {
  return NextResponse.json(
    { success: true, message },
    { status }
  )
}
