import { model, Schema } from 'mongoose';

const AttachmentSchema = new Schema({
  application: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },

  label: {
    type: String,
    trim: true,
  },

  name: {
    type: String,
    trim: true,
  },

  type: {
    type: String,
    trim: true,
  },

  data: {
    type: Buffer,
  },
}, { timestamps: true });

const { API_BASE } = process.env;

AttachmentSchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    ret.url = `${API_BASE}attachments/${ret.id}`;
    delete ret.application;
    delete ret.data;
    delete ret._id;
    delete ret.__v;
  },
});

export default model('Attachment', AttachmentSchema);
