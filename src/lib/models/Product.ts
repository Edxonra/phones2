import mongoose, { Schema, Types } from 'mongoose';
import { Battery, BATTERY_OPTIONS, Color, COLOR_OPTIONS, Storage, STORAGE_OPTIONS, Condition, CONDITION_OPTIONS } from '@/src/shared/product.enum';

export interface IProduct {
  model: Types.ObjectId;
  price: number;
  storage?: Storage;
  color: Color;
  stock: number;
  active: boolean;
  batteryHealth?: Battery
  condition: Condition
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  model: {
    type: Schema.Types.ObjectId,  
    ref: 'Model',
    required: [true, 'Model is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be non-negative'],
  },
  storage: {
    type: String,
    enum: {
      values: STORAGE_OPTIONS as unknown as string[],
      message: `Storage must be one of: ${STORAGE_OPTIONS.join(', ')}`,
    },
    required: false,
  },
  color: {
    type: String,
    enum: {
      values: COLOR_OPTIONS as unknown as string[],
      message: `Color must be one of: ${COLOR_OPTIONS.join(', ')}`,
    },
    required: [true, 'Color is required']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock must be non-negative'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  batteryHealth: {
    type: String,
    enum: {
      values: BATTERY_OPTIONS as unknown as string[],
      message: `Battery health must be one of: ${BATTERY_OPTIONS.join(', ')}`,
    },
    required: false,
  },
  condition: {
    type: String,
    enum: {
      values: CONDITION_OPTIONS as unknown as string[],
      message: `Condition must be one of: ${CONDITION_OPTIONS.join(', ')}`,
    },
    required: [true, 'Condition is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must not exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Add indexes for common queries and filtering
ProductSchema.index({ model: 1 })
ProductSchema.index({ active: 1 })
ProductSchema.index({ stock: 1 })
ProductSchema.index({ model: 1, active: 1 })
ProductSchema.index({ model: 1, color: 1, storage: 1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;