import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  // the email is also the username
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },

  isEvaluator: {
    type: Boolean,
    default: false,
  },

  ipAddresses: {
    type: [String],
  },

  password: {
    type: String,
    trim: true,
    required: true,
  },
}, { timestamps: true });

// because we permit user look-ups based on email
UserSchema.index({ email: 1 });

UserSchema.methods.canView = function (anotherUser) {
  if (this.isEvaluator) return true;
  if (this._id.equals(anotherUser._id)) return true;

  return false;
};

UserSchema.methods.canEdit = function (anotherUser) {
  if (this._id.equals(anotherUser._id)) return true;

  return false;
};

UserSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  },
});

export default model('User', UserSchema);
