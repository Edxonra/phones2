import mongoose, { Document, Schema } from 'mongoose';
import { Brand, BRAND_OPTIONS, Category, CATEGORY_OPTIONS } from '@/src/shared/model.enum';

export interface IModel extends Document {
  name: string;
  brand: Brand;
  category: Category;
  image: string;
}

const ModelSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Model name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    enum: {
      values: BRAND_OPTIONS as unknown as string[],
      message: `Brand must be one of: ${BRAND_OPTIONS.join(', ')}`,
    },
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: CATEGORY_OPTIONS as unknown as string[],
      message: `Category must be one of: ${CATEGORY_OPTIONS.join(', ')}`,
    },
  },
  image: {
    type: String,
    required: [true, 'Image is required'],
    default: '/uploads/models/sample.jpg',
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
ModelSchema.index({ brand: 1 })
ModelSchema.index({ category: 1 })
ModelSchema.index({ brand: 1, category: 1 })

// Prevent re-compilation of model in development
const Model = mongoose.models.Model || mongoose.model<IModel>('Model', ModelSchema);

export default Model;