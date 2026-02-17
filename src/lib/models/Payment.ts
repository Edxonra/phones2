import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IPayment extends Document {
  sale: Types.ObjectId
  amount: number
  paymentDate: Date
  notes?: string
  createdAt: Date
}

const PaymentSchema = new Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  }, {
  timestamps: true,
})
  // Add indexes for common queries
  PaymentSchema.index({ sale: 1 })
  PaymentSchema.index({ paymentDate: -1 })

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)