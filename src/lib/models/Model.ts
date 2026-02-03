import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModel extends Document {
  name: string;
  brand: 'Apple' | 'Samsung' | 'Google';
  category: 'Smartphone' | 'Watch' | 'Laptop' | 'Tablet' | 'Audio'; 
}

const ModelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    enum: ['Apple', 'Samsung', 'Google'],
  },
  category: {
    type: String,
    required: true,
    enum: ['Smartphone' , 'Watch', 'Laptop', 'Tablet', 'Audio'],
  }
  
}, {
  timestamps: true,
});

// Prevent re-compilation of model in development
const Model = mongoose.models.Model || mongoose.model<IModel>('Model', ModelSchema);

export default Model;