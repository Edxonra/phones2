import { NextRequest } from 'next/server'
import Product from '@/src/lib/models/Product'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validatePositiveNumber, validateNonNegativeNumber, validateEnum, validateRequired, ValidationException } from '@/src/lib/api/validation'
import { STORAGE_OPTIONS, COLOR_OPTIONS, BATTERY_OPTIONS, CONDITION_OPTIONS } from '@/src/shared/product.enum'
import { NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { id } = await params

    const { model, price, storage, color, stock, active, batteryHealth, condition, description } = body
    const storageValue = typeof storage === 'string' && storage.trim() !== '' ? storage : undefined
    const batteryValue = typeof batteryHealth === 'string' && batteryHealth.trim() !== '' ? batteryHealth : undefined

    // Validate required fields
    validateRequired(
      { model, price, color, stock, condition },
      ['model', 'price', 'color', 'stock', 'condition']
    )

    // Validate numeric fields
    validatePositiveNumber(price, 'price')
    validateNonNegativeNumber(stock, 'stock')

    // Validate enums
    if (storageValue) {
      validateEnum(storageValue, STORAGE_OPTIONS as unknown as readonly string[], 'storage')
    }
    validateEnum(color, COLOR_OPTIONS as unknown as readonly string[], 'color')
    if (batteryValue) {
      validateEnum(batteryValue, BATTERY_OPTIONS as unknown as readonly string[], 'batteryHealth')
    }
    validateEnum(condition, CONDITION_OPTIONS as unknown as readonly string[], 'condition')

    const setDoc: {
      model: unknown
      price: number
      color: unknown
      stock: number
      active: boolean
      condition: unknown
      description: unknown
      storage?: string
      batteryHealth?: string
    } = {
      model,
      price: Number(price),
      color,
      stock: Number(stock),
      active: active ?? true,
      condition,
      description,
    }

    const unsetDoc: Record<string, ''> = {}

    if (storageValue) {
      setDoc.storage = storageValue
    } else {
      unsetDoc.storage = ''
    }

    if (batteryValue) {
      setDoc.batteryHealth = batteryValue
    } else {
      unsetDoc.batteryHealth = ''
    }

    const updateDoc: { $set: typeof setDoc; $unset?: Record<string, ''> } = {
      $set: setDoc,
    }

    if (Object.keys(unsetDoc).length > 0) {
      updateDoc.$unset = unsetDoc
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateDoc, {
      new: true,
    })

    if (!updatedProduct) {
      return sendError('Product not found', 404)
    }

    return sendSuccess(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to update product', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return sendError('Product not found', 404)
    }

    return sendMessage('Product deleted successfully')
  } catch (error) {
    console.error('Error deleting product:', error)
    return sendError('Failed to delete product', 500)
  }
}
