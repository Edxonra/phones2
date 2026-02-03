import { NextRequest, NextResponse } from 'next/server'
import Models from '@/src/lib/models/Model'
import connectToDatabase from '@/src/lib/mongodb'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { id } = await params

    const { name, brand, category } = body

    if (!name || !brand || !category) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const updatedModel = await Models.findByIdAndUpdate(
      id,
      {
        name,
        brand,
        category
      },
      { new: true }
    )

    if (!updatedModel) {
      return NextResponse.json(
        { error: 'Modelo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedModel)
  } catch (error) {
    console.error('Error al actualizar modelo:', error)
    return NextResponse.json(
      { error: 'Error al actualizar modelo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedModel = await Models.findByIdAndDelete(id)

    if (!deletedModel) {
      return NextResponse.json(
        { error: 'Modelo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Modelo eliminado' })
  } catch (error) {
    console.error('Error al eliminar modelo:', error)
    return NextResponse.json(
      { error: 'Error al eliminar modelo' },
      { status: 500 }
    )
  }
}
