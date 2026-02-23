import { NextRequest, NextResponse } from 'next/server'
import Model from '@/src/lib/models/Model'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validateString, validateEnum, ValidationException } from '@/src/lib/api/validation'
import { BRAND_OPTIONS, CATEGORY_OPTIONS } from '@/src/shared/model.enum'
import { uploadImageToCloudinary, deleteImageFromCloudinary } from '@/src/lib/cloudinary'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const data = await request.formData()
    const name = data.get('name') as string
    const brand = data.get('brand') as string
    const category = data.get('category') as string
    const image = data.get('image') as File | null

    // Validate required fields
    validateString(name, 'name')
    validateString(brand, 'brand')
    validateString(category, 'category')
    
    // Validate enums
    validateEnum(brand, BRAND_OPTIONS as unknown as readonly string[], 'brand')
    validateEnum(category, CATEGORY_OPTIONS as unknown as readonly string[], 'category')

    const existingModel = await Model.findById(id)

    if (!existingModel) {
      return sendError('Model not found', 404)
    }

    const updateData: Record<string, unknown> = { name, brand, category }
    const previousImage = existingModel.image
    let newImage: string | null = null

    if (image && image.size > 0) {
      newImage = await uploadImageToCloudinary(image, 'phones/models')
      updateData.image = newImage
    }

    const updatedModel = await Model.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedModel) {
      return sendError('Model not found', 404)
    }

    if (newImage && previousImage && previousImage !== newImage) {
      try {
        await deleteImageFromCloudinary(previousImage)
      } catch (err) {
        console.error('Error deleting old image:', err)
      }
    }

    return sendSuccess(updatedModel)
  } catch (error) {
    console.error('Error updating model:', error)
    
    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to update model', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const model = await Model.findById(id)

    if (!model) {
      return sendError('Model not found', 404)
    }

    if (model.image) {
      try {
        await deleteImageFromCloudinary(model.image)
      } catch (err) {
        console.error('Error deleting model image:', err)
      }
    }

    await Model.findByIdAndDelete(id)

    return sendMessage('Model deleted successfully')
  } catch (error) {
    console.error('Error deleting model:', error)
    return sendError('Failed to delete model', 500)
  }
}
