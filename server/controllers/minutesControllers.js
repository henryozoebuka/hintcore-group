import MinutesModel from "../models/minutesModel.js";
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

export const createMinutes = async (req, res) => {
  const { title, body, published } = req.body;
  const { userId: createdBy, currentGroupId: groupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(createdBy) || !mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  if (!title || !body || !createdBy || !groupId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const userExists = await UserModel.findById(createdBy);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newMinutes = await MinutesModel.create({
      title,
      body,
      createdBy,
      published,
      group: groupId, // <-- Make sure to set 'group' field, not 'groupId'
    });

    if (!newMinutes) {
      return res.status(500).json({ message: 'Something went wrong while creating minutes.' });
    }

    res.status(201).json({ message: `${newMinutes.title[0].toUpperCase() + newMinutes.title.slice(1)} created successfully!` });

  } catch (error) {
    console.error('Error creating minutes:', error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const manageMinutesRecords = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10; // You can adjust the page size

  if (!currentGroupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    // Count total documents for pagination
    const totalMinutesRecords = await MinutesModel.countDocuments({ group: currentGroupId });

    const minutesRecords = await MinutesModel.find({ group: currentGroupId })
      .select('-body')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalMinutesRecords / limit);

    res.status(200).json({
      minutesRecords,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching minutes records:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const minutesRecords = async (req, res) => {
  const groupId = req.user.currentGroupId;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    const totalMinutesRecords = await MinutesModel.countDocuments({ group: groupId, published: true });

    const minutesRecords = await MinutesModel.find({ group: groupId, published: true })
      .select('-body')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalMinutesRecords / limit);

    res.status(200).json({
      minutesRecords,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching minutes records:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const manageMinutes = async (req, res) => {
  const { id } = req.params;

  try {
    const minutes = await MinutesModel.findById(id);

    if (!minutes) {
      return res.status(404).json({ message: "Minutes not found" });
    }

    res.status(200).json(minutes);
  } catch (error) {
    console.error("Error fetching minutes:", error); // Log before responding
    res.status(500).json({ message: "Error fetching minutes." });
  }
};

export const minutes = async (req, res) => {
  const { id } = req.params;

  try {
    const minutes = await MinutesModel.findById(id);

    if (!minutes) {
      return res.status(404).json({ message: "Minutes not found" });
    }

    res.status(200).json(minutes);
  } catch (error) {
    console.error("Error fetching minutes:", error);
    res.status(500).json({ message: "Error fetching minutes." });
  }
};

export const searchMinutesRecords = async (req, res) => {
  try {
    const { titleOrDescription, startDate, endDate, page = 1, limit = 10 } = req.query;
    const { currentGroupId } = req.user;


    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    // 🟢 Build query
    let query = { group: currentGroupId, published: true };

    // Title or Content search
    if (titleOrDescription) {
      query.$or = [
        { title: { $regex: titleOrDescription.trim(), $options: "i" } },
        { description: { $regex: titleOrDescription.trim(), $options: "i" } },
      ];
    }

    // 🟢 Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // end of the day
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [minutesRecords, total] = await Promise.all([
      MinutesModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      MinutesModel.countDocuments(query),
    ]);

    return res.status(200).json({
      minutesRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Search minutes records Error:", error);
    return res.status(500).json({ message: "An error occurred while searching minutes records." });
  }
};

export const manageSearchMinutesRecords = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const { titleOrDescription, startDate, endDate, published, page = 1, limit = 10 } = req.query;
    if (!currentGroupId) {
      return res.status(400).json({ message: "Group ID is required." });
    }

    const query = { group: currentGroupId };

    // Title or content regex
    if (titleOrDescription?.trim()) {
      query.$or = [
        { title: { $regex: titleOrDescription.trim(), $options: "i" } },
        { body: { $regex: titleOrDescription.trim(), $options: "i" } },
      ];
    }

    if (published !== undefined && published !== "") {
      if (published === "true" || published === "false") {
        query.published = published === "true";
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // end of the day
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [minutesRecords, total] = await Promise.all([
      MinutesModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MinutesModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ minutesRecords, totalPages });
  } catch (error) {
    console.error("Search minutes records failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMinutes = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, published } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Minutes ID is required" });
    }

    const minutes = await MinutesModel.findById(id);
    if (!minutes) {
      return res.status(404).json({ message: "Minutes not found" });
    }

    if (title) minutes.title = title;
    if (body) minutes.body = body;
    if (typeof published === "boolean") minutes.published = published;

    const updatedMinutes = await minutes.save();

    res.status(200).json({
      message: `${title[0].toUpperCase() + title.slice(1)} updated successfully`,
      minutes: updatedMinutes,
    });

  } catch (error) {
    console.error("Error updating minutes:", error);
    res.status(500).json({ message: "Server error while updating minutes" });
  }
};

export const deleteMinutes = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid minutes ID" });
    }

    // Find the mminutes by ID and delete it
    const deletedMinutes = await MinutesModel.findByIdAndDelete(id);

    if (!deletedMinutes) {
      return res.status(404).json({ message: "Minutes not found" });
    }

    return res.status(200).json({ message: "Minutes deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while deleting minutes" });
  }
};

export const deleteMinutesRecords = async (req, res) => {
  const { ids } = req.body;

  try {
    // Check if ids are provided and are in an array format
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No minutes IDs provided" });
    }

    // Ensure all provided IDs are valid ObjectIds
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({ message: `Invalid IDs: ${invalidIds.join(", ")}` });
    }

    // Delete minutes records with the provided IDs
    const deletedMinutesRecords = await MinutesModel.deleteMany({
      _id: { $in: ids }
    });

    if (deletedMinutesRecords.deletedCount === 0) {
      return res.status(404).json({ message: "No minutes records found to delete" });
    }

    return res.status(200).json({
      message: `${deletedMinutesRecords.deletedCount} minute record${deletedMinutesRecords.deletedCount > 1 ? 's' : ''} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while deleting minutes records" });
  }
};