import { NextResponse, NextRequest } from 'next/server'
import connectToDatabase from '@/src/lib/mongodb'
import Product from '@/src/lib/models/Product'

export async function GET() {
  try {
    await connectToDatabase()
    const products = await Product.find({}).populate({path: 'model',select: 'name brand category',}).sort({ createdAt: -1 })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { model, price, storage, color, stock, description } = body
    const priceNumber = Number(price);
    const stockNumber = Number(stock);

    if (!model || priceNumber <= 0 || !storage || !color || stockNumber < 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const newProduct = new Product({
      model: model,
      price: priceNumber,
      storage,
      color,
      stock: stockNumber,
      description,
    });

    await newProduct.save()
    return NextResponse.json(newProduct, { status: 201 })
  } catch (error: any) {
    console.error("ERROR REAL:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al crear producto" },
      { status: 500 }
    );
  }
}