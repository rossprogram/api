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

  applyingToOhio: {
    type: Boolean,
  },

  applyingToIndiana: {
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

  arriveAtStartOhio: {
    type: Boolean,
  },

  arriveAtStartIndiana: {
    type: Boolean,
  },

  arriveAtStartAsia: {
    type: Boolean,
  },

  nativeEnglish: {
    type: Boolean,
  },

  juniorCounselor: {
    type: Boolean,
    default: false,
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

  schoolAddress: {
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

  pronouns: {
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

  previousExperience: {
    type: String,
  },

  mostInterestingRoss: {
    type: String,
  },

  mostInterestingMath: {
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

  previousParticipationYears: {
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

  eeoAmerindian:  {type: Boolean},
  eeoAsian: {type: Boolean},
  eeoBlack: {type: Boolean},
  eeoHispanic: {type: Boolean},
  eeoMideast: {type: Boolean},
  eeoPacificIslander: {type: Boolean},
  eeoWhite: {type: Boolean},
  eeoPreferNotToAnswer: {type: Boolean},
  eeoOther: {type: Boolean},
  eeoOtherText: {type: String, trim: true},

  submitted: {
    type: Boolean,
  },

  submittedAt: {
    type: Date,
  },

}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

ApplicationSchema.virtual('evaluationCount', {
  ref: 'Evaluation',
  localField: '_id',
  foreignField: 'application',
  count: true,
});

ApplicationSchema.virtual('offer', {
  ref: 'Offer',
  localField: '_id',
  foreignField: 'application',
  justOne: true,
});

ApplicationSchema.index({ user: 1, year: 1 }, { unique: true });

ApplicationSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    ret.evaluationCount = doc.evaluationCount;
    ret.offer = doc.offer;
    delete ret._id;
    delete ret.__v;
  },
});

export default model('Application', ApplicationSchema);
