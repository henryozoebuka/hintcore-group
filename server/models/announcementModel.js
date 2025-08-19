import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  thumbnail: {
    type: String, // S3 URL / CDN path
  },

  body: {
    type: String,
    required: true
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },

  // Audience (all users in group OR only specific roles)
  targetRoles: [
    {
      type: String, // e.g. ["admin", "editor", "viewer"]
    }
  ],

  published: {
    type: Boolean,
    default: false
  },

  // For scheduling posts
  scheduledAt: {
    type: Date,
    default: null
  },

  // Tracking stats
  views: {
    type: Number,
    default: 0
  },

  pinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const AnnouncementModel = mongoose.model('Announcement', announcementSchema);
export default AnnouncementModel;