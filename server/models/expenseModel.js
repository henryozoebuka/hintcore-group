import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
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

  amount: {
    type: Number,
    required: true,
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

const ExpenseModel = mongoose.model('Expense', expenseSchema);
export default ExpenseModel;