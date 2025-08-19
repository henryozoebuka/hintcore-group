import mongoose from 'mongoose';

const userOTPVerificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    OTP: {
        type: String,
        required: true
    },

    dateCreated: {
        type: Date,
        default: Date.now
    },

    expiryDate: {
        type: Date,
        default: () => new Date(Date.now() + 3600000)
    },
});

const UserOTPVerificationModel = mongoose.model('UserOTPVerification', userOTPVerificationSchema);
export default UserOTPVerificationModel;