import { NextResponse } from 'next/server'
import Sale from '@/src/lib/models/Sale'
import '@/src/lib/models/Purchase'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validatePositiveNumber, validateEnum, validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'
import { STATUS_OPTIONS } from '@/src/shared/sale.enum'

export async function GET() {
  try {
    await connectToDatabase()
    const sales = await Sale.find()
      .populate({
        path: 'product',
        populate: {
          path: 'model',
          select: 'name brand category',
        },
      })
      .populate({
        path: 'purchase',
        select: 'cost',
      })
      .sort({ saleDate: -1 })

    return sendSuccess(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return sendError('Failed to fetch sales', 500)
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { product, purchase, client, salePrice, saleDate, status, notes } = body

    // Validate required fields
    validateRequired(
      { product, purchase, client, salePrice, saleDate, status },
      ['product', 'purchase', 'client', 'salePrice', 'saleDate', 'status']
    )

    // Validate specific fields
    validateString(client, 'client')
    validatePositiveNumber(salePrice, 'salePrice')
    validateEnum(status, STATUS_OPTIONS as unknown as readonly string[], 'status')

    const sale = new Sale({
      product,
      purchase,
      client,
      salePrice: Number(salePrice),
      saleDate,
      status,
      notes,
    })

    await sale.save()
    return sendSuccess(sale, 201)
  } catch (error) {
    console.error('Error creating sale:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to create sale', 500)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const { product, purchase, client, salePrice, saleDate, status, notes } = body

    // Validate required fields
    validateRequired(
      { product, purchase, client, salePrice, saleDate, status },
      ['product', 'purchase', 'client', 'salePrice', 'saleDate', 'status']
    )

    // Validate specific fields
    validateString(client, 'client')
    validatePositiveNumber(salePrice, 'salePrice')
    validateEnum(status, STATUS_OPTIONS as unknown as readonly string[], 'status')

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      {
        product,
        purchase,
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