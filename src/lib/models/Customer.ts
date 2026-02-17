import mongoose, { Document, Schema } from 'mongoose'

export interface ICustomer extends Document {
  name: string
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [120, 'Name must not exceed 120 characters'],
  },
  
}, {
  timestamps: true,
})

CustomerSchema.index({ name: 1 })

if (mongoose.models.Customer) {
  delete mongoose.models.Customer
}

const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema)

export default Customer
