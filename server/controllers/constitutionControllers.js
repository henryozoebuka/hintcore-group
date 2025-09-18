import ConstitutionModel from "../models/constitutionModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';
import mongoose from "mongoose";
import GroupModel from "../models/groupModel.js";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

export const createConstitution = async (req, res) => {
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

    const newConstitution = await ConstitutionModel.create({
      title,
      body,
      createdBy,
      published,
      group: groupId, // <-- Make sure to set 'group' field, not 'groupId'
    });

    if (!newConstitution) {
      return res.status(500).json({ message: 'Something went wrong while creating constitution.' });
    }

    res.status(201).json({ message: `${title[0].toUpperCase() + title.slice(1)} created successfully!` });

  } catch (error) {
    console.error('Error creating constitution:', error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const manageConstitutions = async (req, res) => {
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
    const totalConstitutions = await ConstitutionModel.countDocuments({ group: currentGroupId });


    const constitutions = await ConstitutionModel.find({ group: currentGroupId })
      .select('-body')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalConstitutions / limit);

    res.status(200).json({
      constitutions,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching constitutions:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const constitutions = async (req, res) => {
  // const { id: groupId } = req.params;
  const groupId = req.user.currentGroupId;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    const totalConstitutions = await ConstitutionModel.countDocuments({ group: groupId, published: true });

    const constitutions = await ConstitutionModel.find({ group: groupId, published: true })
      .select('-body')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalConstitutions / limit);

    res.status(200).json({
      constitutions,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching constitutions:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const manageConstitution = async (req, res) => {
  const { id } = req.params;

  try {
    const constitution = await ConstitutionModel.findById(id);

    if (!constitution) {
      return res.status(404).json({ message: "Constitution not found" });
    }

    res.status(200).json(constitution);
  } catch (error) {
    console.error("Error fetching constitution:", error); // Log before responding
    res.status(500).json({ message: "Error fetching constitution." });
  }
};

export const constitution = async (req, res) => {
  const { id } = req.params;

  try {
    const constitution = await ConstitutionModel.findById(id);

    if (!constitution) {
      return res.status(404).json({ message: "Constitution not found" });
    }

    res.status(200).json(constitution);
  } catch (error) {
    console.error("Error fetching constitution:", error);
    res.status(500).json({ message: "Error fetching constitution." });
  }
};

export const searchConstitutions = async (req, res) => {
  try {
    const { titleOrDescription, startDate, endDate, page = 1, limit = 10 } = req.query;
    const { currentGroupId } = req.user;


    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
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

    const [constitutions, total] = await Promise.all([
      ConstitutionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ConstitutionModel.countDocuments(query),
    ]);

    return res.status(200).json({
      constitutions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Search Constitutions Error:", error);
    return res.status(500).json({ message: "An error occurred while searching constitutions." });
  }
};

export const manageSearchConstitutions = async (req, res) => {

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

    const [constitutions, total] = await Promise.all([
      ConstitutionModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ConstitutionModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({ constitutions, totalPages });
  } catch (error) {
    console.error("Search constitutions failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateConstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, published } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Constitution ID is required" });
    }

    const constitution = await ConstitutionModel.findById(id);
    if (!constitution) {
      return res.status(404).json({ message: "Constitution not found" });
    }

    if (title) constitution.title = title;
    if (body) constitution.body = body;
    if (typeof published === "boolean") constitution.published = published;

    const updatedConstitution = await constitution.save();

    res.status(200).json({
      message: `${title[0].toUpperCase() + title.slice(1)} updated successfully`,
      constitution: updatedConstitution,
    });

  } catch (error) {
    console.error("Error updating constitution:", error);
    res.status(500).json({ message: "Server error while updating constitution" });
  }
};

export const deleteConstitution = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid constitution ID" });
    }

    // Find the constitution by ID and delete it
    const deletedConstitution = await ConstitutionModel.findByIdAndDelete(id);

    if (!deletedConstitution) {
      return res.status(404).json({ message: "Constitution not found" });
    }

    return res.status(200).json({ message: "Constitution deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while deleting constitution" });
  }
};

export const deleteMultipleConstitutions = async (req, res) => {
  const { ids } = req.body;

  try {
    // Check if ids are provided and are in an array format
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No constitution IDs provided" });
    }

    // Ensure all provided IDs are valid ObjectIds
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({ message: `Invalid IDs: ${invalidIds.join(", ")}` });
    }

    // Delete constitutions with the provided IDs
    const deletedConstitutions = await ConstitutionModel.deleteMany({
      _id: { $in: ids }
    });

    if (deletedConstitutions.deletedCount === 0) {
      return res.status(404).json({ message: "No constitutions found to delete" });
    }

    return res.status(200).json({
      message: `${deletedConstitutions.deletedCount} constitution(s) deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error while deleting constitutions" });
  }
};