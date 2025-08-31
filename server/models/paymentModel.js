import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
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
        required: true
    },

    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        paid: { type: Boolean, default: false }
    }],

    dueDate: {
        type: Date,
    },

    required: {
        type: Boolean,
        default: false
    },

    published: {
        type: Boolean,
        default: false
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

},
    { timestamps: true });

const PaymentModel = mongoose.model('Payment', paymentSchema);
export default PaymentModel;