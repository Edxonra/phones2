import { NextRequest, NextResponse } from 'next/server'
import Expense from '@/src/lib/models/Expense'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError, sendMessage } from '@/src/lib/api/response'
import { validatePositiveNumber, validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const body = await request.json()

    const { sale, description, amount, expenseDate } = body
    const [year, month, day] = String(expenseDate).split('-').map(Number)

    validateRequired(
      { sale, description, amount, expenseDate },
      ['sale', 'description', 'amount', 'expenseDate']
    )

    validateString(description, 'description')
    validatePositiveNumber(amount, 'amount')

    const localDate = new Date(year, month - 1, day, 12, 0, 0)

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      {
        sale,
        description,
        amount: Number(amount),
        expenseDate: localDate,
      },
      { new: true }
    )

    if (!updatedExpense) {
      return sendError('Expense not found', 404)
    }

    return sendSuccess(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to update expense', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params

    const deletedExpense = await Expense.findByIdAndDelete(id)

    if (!deletedExpense) {
      return sendError('Expense not found', 404)
    }

    return sendMessage('Expense deleted successfully')
  } catch (error) {
    console.error('Error deleting expense:', error)
    return sendError('Failed to delete expense', 500)
  }
}
