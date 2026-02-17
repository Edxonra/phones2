import { Status, STATUS_OPTIONS } from '@/src/shared/sale.enum'
import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ISale extends Document {
  product: Types.ObjectId
  purchase: Types.ObjectId
  client: string
  salePrice: number
  saleDate: Date
  status: Status
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const SaleSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true,
  },
  client: {
    type: String,
    required: true,
    trim: true,
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: STATUS_OPTIONS,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
})
// Add indexes for common queries
SaleSchema.index({ product: 1 })
SaleSchema.index({ purchase: 1 })
SaleSchema.index({ status: 1 })
SaleSchema.index({ saleDate: -1 })
SaleSchema.index({ product: 1, status: 1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Sale) {
  delete mongoose.models.Sale
}

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema)