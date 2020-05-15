import { model, Schema } from 'mongoose';

const PaymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  description: {
    type: String,
    trim: true,
  },

  amount: { // in cents
    required: true,
    type: Number,
  },

  canceled: {
    type: Boolean,
  },

  processing: {
    type: Boolean,
  },

  succeeded: {
    type: Boolean,
  },

  scholarship: {
    type: Boolean,
  },

  intent: {
    type: String,
    index: true,
  },

  lastPaymentError: { type: Object },

}, { timestamps: true });

PaymentSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

export default model('Payment', PaymentSchema);
