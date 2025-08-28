import AnnouncementModel from "../models/announcementModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';
import mongoose from "mongoose";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

export const createAnnouncement = async (req, res) => {
  const { title, body, createdBy, published, groupId } = req.body;

  if (!title || !body || !createdBy || !groupId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const userExists = await UserModel.findById(createdBy);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newAnnouncement = await AnnouncementModel.create({
      title,
      body,
      createdBy,
      published,
      group: groupId, // <-- Make sure to set 'group' field, not 'groupId'
    });

    if (!newAnnouncement) {
      return res.status(500).json({ message: 'Something went wrong while creating announcement.' });
    }

    res.status(201).json({ message: 'Announcement created successfully!' });

  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const manageAnnouncements = async (req, res) => {
  const { id: groupId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // You can adjust the page size

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    // Count total documents for pagination
    const totalAnnouncements = await AnnouncementModel.countDocuments({ group: groupId });

    
    const announcements = await AnnouncementModel.find({ group: groupId })
      .select('-body')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalAnnouncements / limit);

    res.status(200).json({
      announcements,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const announcements = async (req, res) => {
  const { id: groupId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    const totalAnnouncements = await AnnouncementModel.countDocuments({ group: groupId, published: true });

    const announcements = await AnnouncementModel.find({ group: groupId, published: true })
      .select('-body')  
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalAnnouncements / limit);

    res.status(200).json({
      announcements,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const manageAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const announcement = await AnnouncementModel.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error); // Log before responding
    res.status(500).json({ message: "Error fetching announcement." });
  }
};

export const announcement = async (req, res) => {
  const { id } = req.params;

  try {
    const announcement = await AnnouncementModel.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({ message: "Error fetching announcement." });
  }
};

export const searchAnnouncements = async (req, res) => {
  try {
    const { titleOrContent, date, page = 1, limit = 10 } = req.query;
    const { id: groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required." });
    }

    const query = {
      group: groupId,
      published: true,
    };

    if (titleOrContent?.trim()) {
      query.$or = [
        { title: { $regex: titleOrContent.trim(), $options: "i" } },
        { body: { $regex: titleOrContent.trim(), $options: "i" } },
      ];
    }

    if (date?.trim()) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [announcements, total] = await Promise.all([
      AnnouncementModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AnnouncementModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({ announcements, totalPages });
  } catch (error) {
    console.error("Search announcements failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const manageSearchAnnouncements = async (req, res) => {
  try {
    const { titleOrContent, date, page = 1, limit = 10 } = req.query;
    const { id: groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required." });
    }

    const query = { group: groupId };

    // Title or content regex
    if (titleOrContent?.trim()) {
      query.$or = [
        { title: { $regex: titleOrContent.trim(), $options: "i" } },
        { body: { $regex: titleOrContent.trim(), $options: "i" } },
      ];
    }

    // Date filter (YYYY-MM-DD)
    if (date?.trim()) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [announcements, total] = await Promise.all([
      AnnouncementModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AnnouncementModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ announcements, totalPages });
  } catch (error) {
    console.error("Search announcements failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, published } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Announcement ID is required" });
    }

    const announcement = await AnnouncementModel.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (title) announcement.title = title;
    if (body) announcement.body = body;
    if (typeof published === "boolean") announcement.published = published;

    const updatedAnnouncement = await announcement.save();

    res.status(200).json({
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement,
    });

  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Server error while updating announcement" });
  }
};

export const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;

    try {
        // Ensure the provided ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid announcement ID" });
        }

        // Find the announcement by ID and delete it
        const deletedAnnouncement = await AnnouncementModel.findByIdAndDelete(id);

        if (!deletedAnnouncement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        return res.status(200).json({ message: "Announcement deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while deleting announcement" });
    }
};

export const deleteMultipleAnnouncements = async (req, res) => {
    const { ids } = req.body;

    try {
        // Check if ids are provided and are in an array format
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No announcement IDs provided" });
        }

        // Ensure all provided IDs are valid ObjectIds
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
            return res.status(400).json({ message: `Invalid IDs: ${invalidIds.join(", ")}` });
        }

        // Delete announcements with the provided IDs
        const deletedAnnouncements = await AnnouncementModel.deleteMany({
            _id: { $in: ids }
        });

        if (deletedAnnouncements.deletedCount === 0) {
            return res.status(404).json({ message: "No announcements found to delete" });
        }

        return res.status(200).json({
            message: `${deletedAnnouncements.deletedCount} announcement(s) deleted successfully`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while deleting announcements" });
    }
};