import { NextResponse, NextRequest } from 'next/server'
import Expense from '@/src/lib/models/Expense'
import connectToDatabase from '@/src/lib/mongodb'
import { sendSuccess, sendError } from '@/src/lib/api/response'
import { validatePositiveNumber, validateRequired, validateString, ValidationException } from '@/src/lib/api/validation'

export async function GET() {
  try {
    await connectToDatabase()
    const expenses = await Expense.find()
      .populate({
        path: 'sale',
        populate: {
          path: 'product',
          populate: {
            path: 'model',
            select: 'name brand category image',
          },
        },
      })
      .sort({ expenseDate: -1 })

    return sendSuccess(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return sendError('Failed to fetch expenses', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
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

    const expense = new Expense({
      sale,
      description,
      amount: Number(amount),
      expenseDate: localDate,
    })

    await expense.save()
    return sendSuccess(expense, 201)
  } catch (error) {
    console.error('Error creating expense:', error)

    if (error instanceof ValidationException) {
      return NextResponse.json(
        { success: false, errors: error.errors },
        { status: 400 }
      )
    }

    return sendError('Failed to create expense', 500)
  }
}
