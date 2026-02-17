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

    const updateDoc: Record<string, any> = {
      $set: {
        model,
        price: Number(price),
        color,
        stock: Number(stock),
        active: active ?? true,
        condition,
        description,
      },
    }

    if (storageValue) {
      updateDoc.$set.storage = storageValue
    } else {
      updateDoc.$unset = { ...(updateDoc.$unset || {}), storage: '' }
    }

    if (batteryValue) {
      updateDoc.$set.batteryHealth = batteryValue
    } else {
      updateDoc.$unset = { ...(updateDoc.$unset || {}), batteryHealth: '' }
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
