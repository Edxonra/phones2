import { NextRequest, NextResponse } from 'next/server'
import Model from '@/src/lib/models/Model'
import connectToDatabase from '@/src/lib/mongodb'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validateString, validateEnum, ValidationException } from '@/src/lib/api/validation'
import { BRAND_OPTIONS, CATEGORY_OPTIONS } from '@/src/shared/model.enum'

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

    const updateData: Record<string, unknown> = { name, brand, category }

    // If new image is provided, save it and delete the old one
    if (image && image.size > 0) {
      const oldModel = await Model.findById(id)
      
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `${Date.now()}-${image.name}`
      const uploadDir = path.join(process.cwd(), 'public/uploads/models')
      const filePath = path.join(uploadDir, fileName)
      await writeFile(filePath, buffer)
      updateData.image = `/uploads/models/${fileName}`

      // Delete old image file if it exists and is not the default
      if (oldModel?.image && !oldModel.image.includes('sample.jpg')) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', oldModel.image)
          await unlink(oldImagePath)
        } catch (err) {
          console.error('Error deleting old image:', err)
        }
      }
    }

    const updatedModel = await Model.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedModel) {
      return sendError('Model not found', 404)
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

    const model = await Model.findByIdAndDelete(id)

    if (!model) {
      return sendError('Model not found', 404)
    }

    return sendMessage('Model deleted successfully')
  } catch (error) {
    console.error('Error deleting model:', error)
    return sendError('Failed to delete model', 500)
  }
}
