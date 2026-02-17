import { NextResponse } from 'next/server'
import Sale from '@/src/lib/models/Sale'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validatePositiveNumber, validateEnum, validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'
import { STATUS_OPTIONS } from '@/src/shared/sale.enum'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const { product, client, salePrice, saleDate, status, notes } = body

    // Validate required fields
    validateRequired(
      { product, client, salePrice, saleDate, status },
      ['product', 'client', 'salePrice', 'saleDate', 'status']
    )

    // Validate specific fields
    validateString(client, 'client')
    validatePositiveNumber(salePrice, 'salePrice')
    validateEnum(status, STATUS_OPTIONS as unknown as readonly string[], 'status')

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        product,
        client,
        salePrice: Number(salePrice),
        saleDate,
        status,
        notes,
      },
      { new: true }
    )

    if (!updatedSale) {
      return sendError('Sale not found', 404)
    }

    return sendSuccess(updatedSale)
  } catch (error) {
    console.error('Error updating sale:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to update sale', 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedSale = await Sale.findByIdAndDelete(id)

    if (!deletedSale) {
      return sendError('Sale not found', 404)
    }

    return sendMessage('Sale deleted successfully')
  } catch (error) {
    console.error('Error deleting sale:', error)
    return sendError('Failed to delete sale', 500)
  }
}
