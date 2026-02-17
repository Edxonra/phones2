import { NextResponse, NextRequest } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Product from '@/src/lib/models/Product'
import '@/src/lib/models/Model'
import { sendSuccess, sendError } from '@/src/lib/api/response'
import { validatePositiveNumber, validateNonNegativeNumber, validateEnum, validateRequired, ValidationException } from '@/src/lib/api/validation'
import { STORAGE_OPTIONS, COLOR_OPTIONS, BATTERY_OPTIONS, CONDITION_OPTIONS } from '@/src/shared/product.enum'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const activeParam = request.nextUrl.searchParams.get('active')
    const filter: { active?: boolean } = {}

    if (activeParam === 'true' || activeParam === '1') {
      filter.active = true
    } else if (activeParam === 'false' || activeParam === '0') {
      filter.active = false
    }

    const products = await Product.find(filter).populate({
      path: 'model',
      select: 'name brand category',
    }).sort({ createdAt: -1 })
    return sendSuccess(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return sendError('Failed to fetch products', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

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

    const newProduct = new Product({
      model,
      price: Number(price),
      storage: storageValue,
      color,
      stock: Number(stock),
      active: active ?? true,
      batteryHealth: batteryValue,
      condition,
      description,
    })

    await newProduct.save()
    return sendSuccess(newProduct, 201)
  } catch (error) {
    console.error('Error creating product:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to create product', 500)
  }
}