import { NextResponse, NextRequest } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Model from '@/src/lib/models/Model'

export async function GET() {
  try {
    await connectToDatabase()
    const models = await Model.find({}).populate('brand', 'name').sort({ createdAt: -1 })
    return NextResponse.json(models)
  } catch (error) {
    console.error('Error al obtener modelos:', error)
    return NextResponse.json(
      { error: 'Error al obtener modelos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo modelo
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { name, brand, category } = body

    if (!name || !brand || !category) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const newModel = new Model({
      name,
      brand,
      category
    })

    await newModel.save()
    return NextResponse.json(newModel, { status: 201 })
  } catch (error) {
    console.error('Error al crear modelo:', error)
    return NextResponse.json(
      { error: 'Error al crear modelo' },
      { status: 500 }
    )
  }
}