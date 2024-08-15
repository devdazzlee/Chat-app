import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
// User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model('Message', messageSchema);
const groupSchema = new mongoose.Schema({
  name: {
      type: String,
      required: true,
  },
  members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
  }],
  messages: [{
      from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
      },
      message: {
          type: String,
      },
      createdAt: {
          type: Date,
          default: Date.now,
      },
  }],
});

export const Group = mongoose.model('Group', groupSchema);


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));
