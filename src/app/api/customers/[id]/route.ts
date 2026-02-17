import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Customer from '@/src/lib/models/Customer'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const { name } = body

    validateRequired({ name }, ['name'])
    validateString(name, 'name')

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )

    if (!updatedCustomer) {
      return sendError('Customer not found', 404)
    }

    return sendSuccess(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to update customer', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedCustomer = await Customer.findByIdAndDelete(id)

    if (!deletedCustomer) {
      return sendError('Customer not found', 404)
    }

    return sendMessage('Customer deleted successfully')
  } catch (error) {
    console.error('Error deleting customer:', error)
    return sendError('Failed to delete customer', 500)
  }
}
