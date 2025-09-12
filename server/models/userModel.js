import mongoose from 'mongoose';
import { type } from 'os';

const userGroupSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },

    permissions: {
        type: [String],
        default: [] // e.g., ["manage_users", "manage_announcements"]
    },
    
}, { _id: false });

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    bio: {
        type: String,
        default: ''
    },

    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'other'
    },

    imageUrl: {
        type: String,
        default: ''
    },

    verified: {
        type: Boolean,
        default: false
    },

    groups: {
        type: [userGroupSchema],
        default: []
    },

    currentGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },

    OTPNumberOfAttempts: {
        type: Number,
        default: 0
    },

    OTPBlockedUntil: {
        type: Date,
        default: null,
    },

    globalNotificationsEnabled: {
        type: Boolean,
        default: false,
    },

    deviceTokens: {
        type: [String],
        default: [],
    },

}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);
export default UserModel;