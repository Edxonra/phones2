import { NextRequest } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Customer from '@/src/lib/models/Customer'
import { sendSuccess, sendError } from '@/src/lib/api/response'
import { validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectToDatabase()
    const customers = await Customer.find({}).sort({ createdAt: -1 })
    return sendSuccess(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return sendError('Failed to fetch customers', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { name } = body

    validateRequired({ name }, ['name'])
    validateString(name, 'name')

    const newCustomer = new Customer({
      name,
    })

    await newCustomer.save()
    return sendSuccess(newCustomer, 201)
  } catch (error) {
    console.error('Error creating customer:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to create customer', 500)
  }
}
