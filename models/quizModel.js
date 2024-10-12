import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  questions: [
    {
      question: { type: String, required: true },
      type: { type: String, enum: ['single', 'multiple', 'truefalse'], required: true },
      options: [String],
      correctAnswers: [Number], // For multiple answers
    },
  ],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Create a virtual property for status
quizSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.startDate > now) return 'upcoming';
  if (this.endDate < now) return 'ended';
  return 'ongoing';
});

// Optionally, you can also set toJSON to include virtuals
quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
