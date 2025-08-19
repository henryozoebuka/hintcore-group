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

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Always tied to a real user
    },

    members: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            status: {
                type: String,
                enum: ["active", "inactive"],
                default: "inactive",
            },
            permissions: {
                type: [String],
                default: [], // e.g., ["manage_users", "manage_announcements"]
            },
        },
    ],

    announcements: [
        {
            title: String,
            body: String,
            createdAt: { type: Date, default: Date.now },
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
    ],

    // Optional: track group status
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },

    // For search and join requests
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