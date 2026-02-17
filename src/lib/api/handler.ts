import { NextRequest, NextResponse } from 'next/server'
import { sendError } from './response'
import { ValidationException } from './validation'
import connectToDatabase from '@/src/lib/mongodb'

/**
 * Wrapper for API route handlers with built-in error handling
 * Connects to database and catches errors
 */
export async function handleApiRequest(
  callback: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectToDatabase()
    return await callback(null as any)
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * Wrapper for API route handlers with request body
 */
export async function handleApiRequestWithBody<T>(
  callback: (req: NextRequest, body: T) => Promise<NextResponse>,
  req: NextRequest
): Promise<NextResponse> {
  try {
    await connectToDatabase()
    const body = await req.json()
    return await callback(req, body)
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return sendError('Invalid JSON in request body', 400)
    }

    return sendError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}
