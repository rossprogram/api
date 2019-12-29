import { model, Schema } from 'mongoose';

const ApplicationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  year: {
    type: Number,
    required: true,
  },


  worksheet: {
    type: String,
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  url: {
    type: String,
    required: true,
  },

  score: {
    type: Number,
    required: true,
  },

}, { timestamps: true });

ApplicationSchema.index({ user: 1, year: 1 }, { unique: true });

ApplicationSchema.set('toJSON', {
  transform(doc, ret, options) {
    delete ret._id;
    delete ret.__v;
  },
});

export default model('Application', ApplicationSchema);
