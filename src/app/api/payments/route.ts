import { NextResponse } from 'next/server'
import Payment from '@/src/lib/models/Payment'
import Sale from '@/src/lib/models/Sale'
import '@/src/lib/models/Product'
import '@/src/lib/models/Model'
import connectToDatabase from '@/src/lib/mongodb'

async function syncSaleStatus(saleId: string) {
  const sale = await Sale.findById(saleId)
  if (!sale) return

  const payments = await Payment.find({ sale: saleId }).select('amount')
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  const newStatus = totalPaid >= sale.salePrice ? 'Cancelado' : 'Pendiente'
  if (sale.status !== newStatus) {
    sale.status = newStatus
    await sale.save()
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
    const [year, month, day] = paymentDate.split('-').map(Number)

    if (!sale || amount <= 0 || !paymentDate) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    const localDate = new Date(year, month - 1, day, 12, 0, 0)

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
      { error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}