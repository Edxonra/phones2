import mongoose, { Schema, Types } from 'mongoose';

export interface IProduct {
  model: Types.ObjectId;
  price: number;
  storage: '128GB' | '256GB' | '512GB' | '1TB' | '2TB';
  color: 'Negro Espacial' | 'Naranja Cósmico' | 'Gris Espacial' | 'Grafito' | 'Plateado' | 'Azul' | 'Negro';
  stock: number;
  active: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  model: {
    type: Schema.Types.ObjectId,  
    ref: 'Model',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  storage: {
    type: String,
    enum: ['128GB', '256GB', '512GB', '1TB', '2TB'],
    required: true
  },
  color: {
    type: String,
    enum: ['Negro Espacial', 'Naranja Cósmico', 'Gris Espacial', 'Grafito', 'Plateado', 'Azul', 'Negro'],
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  active: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Prevent re-compilation of model in development
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;