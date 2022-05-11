import { model, Schema } from 'mongoose';

const OfferSchema = new Schema({
  application: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
    unique: true,
  },

  evaluator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  offer: {
    type: String,
    enum: ['', 'accept', 'reject', 'waitlist'],
  },

  decisionDate: {
    type: String,
  },

  decision: {
    type: String,
    enum: ['', 'yes', 'unsure', 'no'],
  },

  location: {
    type: String,
    enum: ['', 'ohio', 'indiana'],
  },

  travelMethod: {
    type: String,
    enum: ['', 'driving', 'flying'],
  },

  arrivalDate: {
    type: String,
  },

  arrivalTime: {
    type: String,
  },

  flightCarrier: {
    type: String,
  },

  flightNumber: {
    type: String,
  },

  // / the following is only relevant for the 2020 program

  timezone: {
    type: String,
  },

  timezoneOffset: {
    type: Number,
  },

  summerLocation: {
    type: String,
  },

  possibleUsernames: {
    type: [String],
  },

  goodTimes: {
    type: [Number],
  },

}, { timestamps: true });

OfferSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

export default model('Offer', OfferSchema);
