import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IInventoryPurchase extends Document {
  provider: 'Apple' | 'Samsung' | 'BackMarket' | 'Amazon' | 'Google'
  product: Types.ObjectId;
  cost: number
  purchaseDate: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const InventoryPurchaseSchema: Schema = new Schema({
  provider: {
    type: String,
    enum: ['Apple', 'Samsung', 'BackMarket', 'Amazon' , 'Google'],
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

const InventoryPurchase = mongoose.models.InventoryPurchase || mongoose.model<IInventoryPurchase>('InventoryPurchase', InventoryPurchaseSchema)

export default InventoryPurchase
