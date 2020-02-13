import { model, Schema } from 'mongoose';

const EvaluationSchema = new Schema({
  evaluator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  application: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },

  overallScore: {
    type: Number,
  },

  problemScores: {
    type: [{ type: String, enum: ['A', 'B', 'C'] }],
  },

  decision: {
    type: String,
    enum: ['', 'accept', 'reject', 'waitlist'],
  },

  comments: {
    type: String,
  },

}, { timestamps: true });

EvaluationSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.evaluator && ret.evaluator.password) {
      ret.evaluator = { id: ret.evaluator._id, email: ret.evaluator.email };
    }
  },
});

export default model('Evaluation', EvaluationSchema);
