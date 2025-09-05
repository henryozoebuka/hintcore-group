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

export const getPaymentDetails = async (req, res) => {
  const paymentId = req.params.id;

  if (!paymentId) {
    return res.status(400).json({ message: 'Payment ID is required.' });
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({ message: 'Invalid Payment ID format.' });
  }

  try {
    const payment = await PaymentModel.findById(paymentId)
      .populate('members.userId', 'fullName email') // populate user info from members
      .populate('createdBy', 'fullName'); // populate creator's full name

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Find the member record for the current user
    const memberInfo = payment.members.find(
      (member) => member.userId._id.toString() === req.user.userId
    );

    if (!memberInfo) {
      return res.status(403).json({ message: 'You are not authorized to view this payment.' });
    }

    const userFullName = memberInfo.userId.fullName;
    const userEmail = memberInfo.userId.email;
    const createdByFullName = payment.createdBy?.fullName;

    const response = {
      _id: payment._id,
      title: payment.title,
      description: payment.description,
      amount: payment.amount,
      dueDate: payment.dueDate,
      required: payment.required,
      paid: memberInfo.paid, // show if the current user paid
      createdBy: createdByFullName,
      user: {
        fullName: userFullName,
        email: userEmail,
      },
    };

    return res.status(200).json({ payment: response });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ message: 'Server error while fetching payment.' });
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
      .populate('members.userId', 'fullName') // Populate member names and emails
      .populate('createdBy', 'fullName'); // Optional: who created the payment

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
    // Fetch payment + populate members
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

    // Build members list with "selected" flag
    const members = allUsers.map((user) => {
      const isSelected = payment.members.some(
        (m) => m.userId && m.userId._id.toString() === user._id.toString()
      );
      const paidStatus = payment.members.find(
        (m) => m.userId && m.userId._id.toString() === user._id.toString()
      )?.paid || false;

      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        selected: isSelected,
        paid: paidStatus,
      };
    });

    // Send back full payment details
    res.status(200).json({
      payment: {
        _id: payment._id,
        title: payment.title,
        description: payment.description,
        amount: payment.amount,
        dueDate: payment.dueDate,
        required: payment.required,
        published: payment.published,
        createdBy: payment.createdBy,
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

  const { currentGroupId } = req.user;

  try {
    // 🔹 Ensure the payment belongs to this group
    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // 🔹 Validate and sync members
    if (Array.isArray(members)) {
      const validUsers = await UserModel.find({ _id: { $in: members } }).select('_id');
      if (validUsers.length !== members.length) {
        return res.status(400).json({ message: 'One or more selected users are invalid.' });
      }

      // Preserve paid status for existing members
      const existingMap = new Map(
        payment.members.map(m => [m.userId.toString(), m.paid])
      );

      // Rebuild members array: keep paid if existed, default false if new
      payment.members = members.map(userId => ({
        userId,
        paid: existingMap.get(userId.toString()) || false,
      }));
    }

    // 🔹 Update other fields
    if (title !== undefined) payment.title = title;
    if (description !== undefined) payment.description = description;
    if (amount !== undefined) payment.amount = Number(amount);
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

export const manageMarkPaymentsAsPaid = async (req, res) => {
  const { paymentId, memberIds = [], paid = true } = req.body;
  const { currentGroupId } = req.user;

  if (
    !mongoose.Types.ObjectId.isValid(paymentId) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid payment or group ID." });
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ message: "Member IDs are required." });
  }

  try {
    // Ensure the payment belongs to the current tenant (group)
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      group: currentGroupId,
    });

    if (!payment) {
      return res
        .status(403)
        .json({ message: "You do not have permissions to update this payment." });
    }

    // Perform update scoped to this group + payment
    const updateResult = await PaymentModel.updateOne(
      { _id: paymentId, group: currentGroupId },
      {
        $set: {
          "members.$[elem].paid": paid,
        },
      },
      {
        arrayFilters: [
          {
            "elem.userId": {
              $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        ],
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "No members updated. Check member IDs." });
    }

    res.status(200).json({
      message: `Updated ${updateResult.modifiedCount} member${updateResult.modifiedCount > 1 ? 's' : ''} as ${
        paid ? "paid" : "unpaid"
      }.`,
    });
  } catch (error) {
    console.error("Error updating members payment:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const manageMarkPaymentsAsUnpaid = async (req, res) => {
  const { paymentId, memberIds = [] } = req.body;
  const { currentGroupId } = req.user;

  if (
    !mongoose.Types.ObjectId.isValid(paymentId) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid payment or group ID." });
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ message: "Member IDs are required." });
  }

  try {
    // Ensure the payment belongs to the current tenant (group)
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      group: currentGroupId,
    });

    if (!payment) {
      return res
        .status(403)
        .json({ message: "You do not have permissions to update this payment." });
    }

    // Perform update scoped to this group + payment
    const updateResult = await PaymentModel.updateOne(
      { _id: paymentId, group: currentGroupId },
      {
        $set: {
          "members.$[elem].paid": false, // force unpaid
        },
      },
      {
        arrayFilters: [
          {
            "elem.userId": {
              $in: memberIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        ],
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "No members updated. Check member IDs." });
    }

    res.status(200).json({message: `Updated ${updateResult.modifiedCount} member${updateResult.modifiedCount > 1 ? 's' : ''} as unpaid.`});
  } catch (error) {
    console.error("Error updating members payment:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const manageGetPaymentMembers = async (req, res) => {
  const { id: paymentId } = req.params;
  const { currentGroupId } = req.user;

  if (
    !mongoose.Types.ObjectId.isValid(paymentId) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid payment or group ID." });
  }

  try {
    // 1. Get the group and its members
    const group = await GroupModel.findById(currentGroupId).populate("members.user", "fullName email");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // 2. Get the payment document
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      group: currentGroupId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this group." });
    }

    // 3. Build response: map group members to include their payment status
    const membersWithStatus = group.members.map((member) => {
      const paymentRecord = payment.members.find(
        (m) => m.userId.toString() === member.user._id.toString()
      );

      return {
        _id: member.user._id,
        fullName: member.user.fullName,
        email: member.user.email,
        memberNumber: member.memberNumber,
        status: member.status,
        paid: paymentRecord ? paymentRecord.paid : false, // default false if not in payment.members
        selected: !!paymentRecord, // helpful for pre-checking in checkboxes
      };
    });

    return res.status(200).json({
      members: membersWithStatus,
    });
  } catch (error) {
    console.error("Error fetching payment members:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
