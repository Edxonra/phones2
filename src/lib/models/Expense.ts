import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IExpense extends Document {
  sale: Types.ObjectId
  description: string
  amount: number
  expenseDate: Date
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema(
  {
    sale: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Description must not exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    expenseDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

ExpenseSchema.index({ sale: 1 })
ExpenseSchema.index({ expenseDate: -1 })

const Expense = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)

export default Expense
