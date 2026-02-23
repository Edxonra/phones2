import { NextResponse } from 'next/server'
import Payment from '@/src/lib/models/Payment'
import Sale from '@/src/lib/models/Sale'
import '@/src/lib/models/Product'
import '@/src/lib/models/Model'
import connectToDatabase from '@/src/lib/mongodb'

async function syncSaleStatus(saleId: string) {
  const sale = await Sale.findById(saleId)
  if (!sale || !sale.purchase) return

  const payments = await Payment.find({ sale: saleId }).select('amount')
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const newStatus = totalPaid >= sale.salePrice ? 'Cancelado' : 'Pendiente'
  if (sale.status !== newStatus) {
    await Sale.findByIdAndUpdate(saleId, { status: newStatus })
  }
}

export async function GET() {
  try {
    await connectToDatabase()
    const payments = await Payment.find()
      .populate({
        path: 'sale',
        populate: {
          path: 'product',
          populate: {
            path: 'model',
              select: 'name brand category image'
          }
        }
      })
      .sort({ paymentDate: -1 })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const body = await request.json()

    const { sale, amount, paymentDate, notes } = body

    if (!sale || !amount || !paymentDate) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: sale, amount, paymentDate' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'amount debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Validar que sale existe
    const existingSale = await Sale.findById(sale)
    if (!existingSale) {
      return NextResponse.json(
        { error: 'Sale no encontrada' },
        { status: 404 }
      )
    }

    let localDate: Date
    
    // Intentar parsear la fecha
    if (typeof paymentDate === 'string') {
      const [year, month, day] = paymentDate.split('-').map(Number)
      if (!year || !month || !day) {
        return NextResponse.json(
          { error: 'paymentDate debe ser en formato YYYY-MM-DD' },
          { status: 400 }
        )
      }
      localDate = new Date(year, month - 1, day, 12, 0, 0)
    } else if (paymentDate instanceof Date) {
      localDate = paymentDate
    } else {
      return NextResponse.json(
        { error: 'paymentDate debe ser una fecha válida' },
        { status: 400 }
      )
    }

    const payment = new Payment({
      sale,
      amount,
      paymentDate: localDate,
      notes,
    })

    await payment.save()
    await syncSaleStatus(sale)
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error al crear pago', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}