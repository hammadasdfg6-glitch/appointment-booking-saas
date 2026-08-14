import mongoose from "mongoose";

const slotSubSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'locked'],
    default: 'available',
    required: true,
  },
}, { _id: true }); 


const slotsSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff', 
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  slots: [slotSubSchema], 
}, {
  timestamps: true,
});


slotsSchema.index({ staffId: 1, date: 1 }, { unique: true });

export const Slots = mongoose.model('slots', slotsSchema);
