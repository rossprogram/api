import { model, Schema } from 'mongoose';

const ComparisonSchema = new Schema({
  evaluator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  application_better: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },

  application_worse: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },

  problem: {
    type: Number,
  },

  comments: {
    type: String,
  },

}, { timestamps: true });

ComparisonSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.evaluator && ret.evaluator.password) {
      ret.evaluator = { id: ret.evaluator._id, email: ret.evaluator.email };
    }
  },
});

export default model('Comparison', ComparisonSchema);
