import { model, Schema } from 'mongoose';

const RecommendationSchema = new Schema({
  application: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },

  email: {
    type: String,
    trim: true,
    required: true,
  },

  password: {
    type: String,
    trim: true,
    required: true,
  },

  type: {
    type: String,
    trim: true,
  },

  name: {
    type: String,
  },

  letter: {
    type: Buffer,
  },

  submittedAt: {
    type: Date,
  },

}, { timestamps: true });

const { API_BASE } = process.env;

RecommendationSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    ret.url = `${API_BASE}recommendations/${ret.id}`;
    delete ret.letter;
    delete ret._id;
    delete ret.password;
    delete ret.__v;
  },
});

export default model('Recommendation', RecommendationSchema);
