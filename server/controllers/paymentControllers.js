import PaymentModel from '../models/paymentModel.js';
import UserModel from '../models/userModel.js';
import GroupModel from '../models/groupModel.js';
import nodemailer from 'nodemailer';
import mongoose from "mongoose";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

export const createPayment = async (req, res) => {
  const {
    group,
    title,
    description,
    amount,
    createdBy,
    members = [],
    dueDate,
    published = false,
  } = req.body;

  // Validate required fields
  if (!group || !title || !description || !amount || !createdBy) {
    return res.status(400).json({
      message: "Group, title, description, amount, and createdBy are required.",
    });
  }

  try {
    // Optional: Verify group exists
    const groupExists = await GroupModel.findById(group);
    if (!groupExists) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Optional: Verify that provided member IDs are valid
    let formattedMembers = [];
    if (Array.isArray(members) && members.length > 0) {
      const validUsers = await UserModel.find({ _id: { $in: members } }).select('_id');
      if (validUsers.length !== members.length) {
        return res.status(400).json({
          message: "One or more selected users are invalid.",
        });
      }

      formattedMembers = members.map(userId => ({ userId }));
    }

    const paymentData = {
      group,
      title,
      description,
      amount: Number(amount), // In case it's a string from frontend
      createdBy,
      members: formattedMembers,
    };

    // Add optional fields if provided
    if (dueDate) paymentData.dueDate = dueDate;
    if (typeof published === 'boolean') paymentData.published = published;

    const newPayment = new PaymentModel(paymentData);
    await newPayment.save();

    return res.status(201).json({ message: "Payment created successfully." });
  } catch (error) {
    console.error("Create Payment Error:", error);
    return res.status(500).json({
      message: "An error occurred while creating the payment.",
    });
  }
};

export const managePayments = async (req, res) => {
  const { id: groupId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    // Count total documents for pagination
    const totalPayments = await PaymentModel.countDocuments({ group: groupId });

    // Fetch payments with pagination
    const payments = await PaymentModel.find({ group: groupId })
      .select('-description') // Optional: exclude large field for summary view
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'fullName')
      .populate('group', 'name');

    const totalPages = Math.ceil(totalPayments / limit);

    res.status(200).json({
      payments,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


