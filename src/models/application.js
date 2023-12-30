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

  // What activities do you engage in outside of classes? (0-100 words)
  outsideOfClass: {
    type: String,
  },

  interestingProblem: {
    type: String,
  },

  //   Passion
  // Tell us about your mathematical journey! - Some possible things you could talk about
  // are the following (you do not have to answer all of these, nor are you limited to these
  // questions): (0-300 words)
  // ● How did you come to love math? What draws you to math?
  // ● What mathematical experiences have you enjoyed?
  // ● What is a mathematical idea you find exciting and would love to share?
  // ● Tell us about some mathematics that you’ve worked on and enjoyed.
  // (All responses are welcome! This isn’t a test for coming up with something
  // “impressive” or for you to try and figure out what math we’re “looking for” - we really
  // want to hear about mathematics that you like and find interesting.)
  passion: {
    type: String,
  },

  //  Community
  // At Ross, you will have to live with many different people, some who you may have
  // much in common with, and some who may have different life experiences from your
  // own. Write a letter to your future community members (your future roommates,
  // classmates, counselors, staff, …): what should people know about you to share the same
  // space as you, and for you to feel valued in a community? (This can include, but is not
  // limited to: what should people know about the way you engage with and learn
  // mathematics?) What will you commit to doing to help make the community one that
  // welcomes your future community members? (0-300 words)
  community: {
    type: String,
  },

  // How did you hear about Ross? (0-50 words)
  referral: {
    type: String,
  },

  // Is there anything else you’d like to tell us? (0-100 words)
  otherInformation: {
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

  // Ross students often come from a myriad of personal backgrounds,
  // with many rich and varied life experiences. How have your
  // personal background and experiences have shaped your academic
  // and/or mathematical journey? (0-150 words)
  previousExperience: {
    type: String,
  },


  // Tell us about your experience at Ross! In particular, what makes you want to return to Ross?
  mostInterestingRoss: {
    type: String,
  },

  // Tell us about what you learned from Ross. What were the most
  // meaningful mathematical experiences you had at Ross? (0-250
  // words)
  mostInterestingMath: {
    type: String,
  },

  books: {
    type: String,
  },

  // Coming to Ross is a 6-week endeavor. What makes you want to come
  // to Ross and do math for 6 weeks? What do you hope to get out of
  // Ross? (0-200 words)
  eager: {
    type: String,
  },

  // What academic interests do you have outside of math? Do you have
  // any particular future goals? (0-100 words)
  intendedMajor: {
    type: String,
  },

  // Collaborating and working together mathematically is an important
  // aspect of Ross.Describe a project or otherwise that you have
  // collaborated with others on (mathematical or otherwise). What
  // norms, practices, and values made the collaboration effective?
  // How will you practice collaboration at Ross to make Ross a
  // welcoming learning environment for everyone? (0-200 words)
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

  //Introduction
  //This is free space for you to tell us about yourself! Introduce yourself to us: who are
  //you? (0-300 words)
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
