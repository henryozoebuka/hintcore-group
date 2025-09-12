import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ['required', 'contribution', 'donation'],
    default: 'required',
  },

  amount: {
    type: Number,
    required: function () {
      return this.type === 'required';
    },
  },

  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

      paid: { type: Boolean, default: false },

      // This allows recording custom donation or contribution amount per user
      amountPaid: { type: Number, default: 0 },
    },
  ],

  dueDate: {
    type: Date,
  },

  published: {
    type: Boolean,
    default: false,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
},
{ timestamps: true });

const PaymentModel = mongoose.model('Payment', paymentSchema);
export default PaymentModel;