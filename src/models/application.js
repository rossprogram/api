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

  applyingToUSA: {
    type: Boolean,
  },

  applyingToAsia: {
    type: Boolean,
  },

  preferredLocation: {
    type: String,
  },

  firstName: {
    type: String,
    trim: true,
  },

  nickname: {
    type: String,
    trim: true,
  },

  lastName: {
    type: String,
    trim: true,
  },

  birthday: {
    type: String,
  },

  arriveAtStartUSA: {
    type: Boolean,
  },

  arriveAtStartAsia: {
    type: Boolean,
  },

  nativeEnglish: {
    type: Boolean,
  },

  toeflNarrative: {
    type: String,
  },

  phone: {
    type: String,
    trim: true,
  },

  schoolName: {
    type: String,
    trim: true,
  },

  schoolName: {
    type: String,
    trim: true,
  },

  address: {
    type: String,
    trim: true,
  },

  gender: {
    type: String,
    trim: true,
  },

  interestingProblem: {
    type: String,
  },

  interestingProjects: {
    type: String,
  },

  competitions: {
    type: String,
  },

  otherPrograms: {
    type: String,
  },

  books: {
    type: String,
  },

  eager: {
    type: String,
  },

  intendedMajor: {
    type: String,
  },

  collaboration: {
    type: String,
  },

  otherCourses: {
    type: String,
  },

  citizenship: {
    type: [String],
  },

  graduationYear: {
    type: Number,
  },

  previousApplicationYears: {
    type: [Number],
  },

  parentName: {
    type: String,
    trim: true,
  },

  parentPhone: {
    type: String,
    trim: true,
  },

  parentEmail: {
    type: String,
    trim: true,
  },

  parentAddress: {
    type: String,
    trim: true,
  },

  personalStatement: {
    type: String,
    trim: true,
  },

  submitted: {
    type: Boolean,
  },

  submittedAt: {
    type: Date,
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
