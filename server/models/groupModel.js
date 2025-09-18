import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        default: "",
        trim: true,
    },

    imageUrl: {
        type: String,
        default: ''
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Always tied to a real user
    },

    abbreviation: { type: String },

    memberCounter: { type: Number, default: 0 },

    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            memberNumber: {
                type: String,
                required: true,
            },
            status: {
                type: String,
                enum: ["active", "inactive"],
                default: "inactive",
            },
            permissions: {
                type: [String],
                default: [],
            },
            notificationsEnabled: {
                type: Boolean,
                default: true,
            },
        },
    ],

    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

    joinCode: {
        type: String,
        unique: true,
        required: true,
    },

    groupPassword: {
        type: String,
        required: true,
        select: false // hide from normal queries
    },

}, { timestamps: true });

const GroupModel = mongoose.model("Group", groupSchema);
export default GroupModel;