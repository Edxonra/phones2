import { NextResponse } from 'next/server'
import Payment from '@/src/lib/models/Payment'
import Sale from '@/src/lib/models/Sale'
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
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

    const existingPayment = await Payment.findById(id)
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      {
        sale,
        amount,
        paymentDate: localDate,
        notes,
      },
      { new: true }
    )

    if (!updatedPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    if (existingPayment && existingPayment.sale.toString() !== sale) {
      await syncSaleStatus(existingPayment.sale.toString())
    }
    await syncSaleStatus(sale)

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error al actualizar pago:', error)
    return NextResponse.json(
      { error: 'Error al actualizar pago' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedPayment = await Payment.findByIdAndDelete(id)

    if (!deletedPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    if (deletedPayment) {
      await syncSaleStatus(deletedPayment.sale.toString())
    }

    return NextResponse.json({ message: 'Pago eliminado' })
  } catch (error) {
    console.error('Error al eliminar pago:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pago' },
      { status: 500 }
    )
  }
}
