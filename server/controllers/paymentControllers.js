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
    title,
    description,
    amount,
    members = [],
    dueDate,
    published = false,
    required = false,
  } = req.body;

  const { userId, currentGroupId} = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  // Validate required fields
  if (!currentGroupId || !title || !description || !amount || !userId) {
    return res.status(400).json({
      message: "Group, title, description, amount, and createdBy are required.",
    });
  }

  try {
    // Optional: Verify group exists
    const groupExists = await GroupModel.findById(currentGroupId);
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
      group: currentGroupId,
      title,
      description,
      amount: Number(amount),
      createdBy: userId,
      members: formattedMembers,
      published,
      required,
    };

    // Add optional fields if provided
    if (dueDate) paymentData.dueDate = dueDate;

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
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!currentGroupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    // Count total documents for pagination
    const totalPayments = await PaymentModel.countDocuments({ group: currentGroupId });

    // Fetch payments with pagination
    const payments = await PaymentModel.find({ group: currentGroupId })
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

export const payments = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  if (!currentGroupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  try {
    // Count total documents for pagination
    const totalPayments = await PaymentModel.countDocuments({ group: currentGroupId, published: true });

    // Fetch payments with pagination
    const payments = await PaymentModel.find({ group: currentGroupId, published: true })
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

export const managePayment = async (req, res) => {
  const paymentId = req.params.id;
  try {
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required.' });
    }

    const payment = await PaymentModel.findById(paymentId)
      .populate('group', 'name') // Populate group name
      .populate('members.userId', 'fullName email') // Populate member names and emails
      .populate('createdBy', 'fullName email'); // Optional: who created the payment

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json({payment});
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error while fetching payment.' });
  }
};

export const manageFetchEditPayment = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  if (
    !mongoose.Types.ObjectId.isValid(currentGroupId) ||
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    // Fetch payment
    const payment = await PaymentModel.findOne({
      _id: id,
      group: currentGroupId,
    }).populate("members.userId", "fullName email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    // Fetch all users in this group
    const allUsers = await UserModel.find(
      { group: currentGroupId },
      "fullName email"
    );

    // Build members list
    const members = allUsers.map((user) => {
      const isSelected = payment.members.some(
        (m) => m.userId && m.userId._id.toString() === user._id.toString()
      );
      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        selected: isSelected,
      };
    });

    res.status(200).json({
      payment: {
        _id: payment._id,
        title: payment.title,
        amount: payment.amount,
        members,
      },
    });
  } catch (error) {
    console.error("Fetch Edit Payment Error:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching payment." });
  }
};

export const manageEditPayment = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    amount,
    dueDate,
    required,
    published,
    members = [],
  } = req.body;

  const { groupId } = req.user;

  try {
    const payment = await PaymentModel.findOne({ _id: id, group: groupId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Validate and format members
    if (Array.isArray(members)) {
      const validUsers = await UserModel.find({ _id: { $in: members } }).select('_id');
      if (validUsers.length !== members.length) {
        return res.status(400).json({ message: 'One or more selected users are invalid.' });
      }

      payment.members = members.map(userId => ({ userId }));
    }

    // Update other fields
    if (title !== undefined) payment.title = title;
    if (description !== undefined) payment.description = description;
    if (amount !== undefined) payment.amount = amount;
    if (dueDate !== undefined) payment.dueDate = dueDate;
    if (required !== undefined) payment.required = required;
    if (published !== undefined) payment.published = published;

    await payment.save();

    return res.status(200).json({
      message: 'Payment updated successfully.',
      payment,
    });
  } catch (error) {
    console.error('Update Payment Error:', error);
    return res.status(500).json({ message: 'Server error while updating payment.' });
  }
};
