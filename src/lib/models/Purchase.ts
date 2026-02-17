import { Provider, PROVIDER_OPTIONS } from '@/src/shared/purchase.enum';
import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IPurchase extends Document {
  provider: Provider
  product: Types.ObjectId
  cost: number
  purchaseDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const PurchaseSchema: Schema = new Schema({
  provider: {
    type: String,
    enum: PROVIDER_OPTIONS,
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  purchaseDate: {
    type: Date,
    required: true,
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
PurchaseSchema.index({ product: 1 })
PurchaseSchema.index({ provider: 1 })
PurchaseSchema.index({ purchaseDate: -1 })
PurchaseSchema.index({ product: 1, provider: 1 })

const Purchase = mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema)

export default Purchase