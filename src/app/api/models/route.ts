import { NextResponse, NextRequest } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Model from '@/src/lib/models/Model'
import { sendSuccess, sendError } from '@/src/lib/api/response'
import { validateString, validateEnum, ValidationException } from '@/src/lib/api/validation'
import { BRAND_OPTIONS, CATEGORY_OPTIONS } from '@/src/shared/model.enum'
import { uploadImageToCloudinary } from '@/src/lib/cloudinary'

export async function GET() {
  try {
    await connectToDatabase()
    const models = await Model.find({}).sort({ createdAt: -1 })
    return sendSuccess(models)
  } catch (error) {
    console.error('Error fetching models:', error)
    return sendError('Failed to fetch models', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const data = await request.formData()

    const name = data.get('name') as string
    const brand = data.get('brand') as string
    const category = data.get('category') as string
    const image = data.get('image') as File

    // Validate required fields
    validateString(name, 'name')
    validateString(brand, 'brand')
    validateString(category, 'category')
    
    if (!image) {
      throw new ValidationException([
        { field: 'image', message: 'Image file is required' }
      ])
    }

    // Validate enums
    validateEnum(brand, BRAND_OPTIONS as unknown as readonly string[], 'brand')
    validateEnum(category, CATEGORY_OPTIONS as unknown as readonly string[], 'category')

    const imageUrl = await uploadImageToCloudinary(image, 'phones/models')

    const newModel = new Model({
      name,
      brand,
      category,
      image: imageUrl,
    })

    await newModel.save()
    return sendSuccess(newModel, 201)
  } catch (error) {
    console.error('Error creating model:', error)
    
    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'ValidationError' &&
      'errors' in error
    ) {
      const validationErrors = Object.values((error as { errors: Record<string, { path?: string; message?: string }> }).errors)
        .map((err) => ({
          field: err.path || 'field',
          message: err.message || 'Validation error',
        }))

      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      )
    }

    return sendError('Failed to create model', 500)
  }
}