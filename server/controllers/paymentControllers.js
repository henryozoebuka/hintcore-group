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
    type = 'required',
  } = req.body;

  const { userId, currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  if (!title || !description || !type) {
    return res.status(400).json({
      message: "Title, description, and type are required.",
    });
  }

  if (type === 'required' && !amount) {
    return res.status(400).json({ message: "Amount is required for required and contribution types." });
  }

  try {
    const groupExists = await GroupModel.findById(currentGroupId);
    if (!groupExists) {
      return res.status(404).json({ message: "Group not found." });
    }

    let formattedMembers = [];
    if (Array.isArray(members) && members.length > 0) {
      // If member input contains userId + amountPaid, validate both
      const userIds = members.map(m => m.userId || m); // support both formats
      const validUsers = await UserModel.find({ _id: { $in: userIds } }).select('_id');
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: "One or more selected users are invalid." });
      }

      formattedMembers = members.map((member) => {
        if (typeof member === 'object') {
          return {
            userId: member.userId,
            amountPaid: member.amountPaid || 0,
          };
        }
        return { userId: member };
      });
    }

    const paymentData = {
      group: currentGroupId,
      title,
      description,
      type,
      createdBy: userId,
      members: formattedMembers,
      published,
    };

    if (amount) paymentData.amount = Number(amount);
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

  try {
    const filter = { group: currentGroupId };

    // Count total payments for pagination
    const totalPayments = await PaymentModel.countDocuments(filter);

    // Fetch paginated payments
    const payments = await PaymentModel.find(filter)
      .select('title type published createdAt') // Exclude heavy field
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    // Optional: Map type to 'required' boolean for legacy frontend
    const mappedPayments = payments.map(payment => ({
      ...payment.toObject(),
      required: payment.type === 'required', // Legacy compatibility
    }));

    const totalPages = Math.ceil(totalPayments / limit);

    res.status(200).json({
      payments: mappedPayments,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const payments = async (req, res) => {
  const { userId, currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    // Count total published payments in the group
    const totalPayments = await PaymentModel.countDocuments({
      group: currentGroupId,
      published: true,
    });

    // Fetch only necessary fields
    const rawPayments = await PaymentModel.find({
      group: currentGroupId,
      published: true,
    })
      .select('title required createdAt members') // only select needed fields
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format payments to include only relevant user info
    const payments = rawPayments.map(payment => {
      const userPayment = payment.members.find(member =>
        member.userId?.toString() === userId.toString()
      );

      return {
        _id: payment._id,
        title: payment.title,
        required: payment.required,
        paid: userPayment ? userPayment.paid : false,
        createdAt: payment.createdAt,
      };
    });

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
  const { currentGroupId } = req.user;

  if (!paymentId) {
    return res.status(400).json({ message: 'Payment ID is required.' });
  }

  if ((!mongoose.Types.ObjectId.isValid(paymentId)) || (!mongoose.Types.ObjectId.isValid(currentGroupId))) {
    return res.status(400).json({ message: 'Invalid ID(s) format.' });
  }

  try {
    const payment = await PaymentModel.findOne({ _id: paymentId, group: currentGroupId })
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
  const { currentGroupId } = req.user;

  if (!paymentId) {
    return res.status(400).json({ message: "Payment ID is required." });
  }

  if (
    !mongoose.Types.ObjectId.isValid(paymentId) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid ID(s) format." });
  }

  try {
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      group: currentGroupId,
    })
      .populate("group", "name")
      .populate("members.userId", "fullName")
      .populate("createdBy", "fullName");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    let responseData = {
      _id: payment._id,
      title: payment.title,
      description: payment.description,
      amount: payment.amount,
      type: payment.type,
      published: payment.published,
      dueDate: payment.dueDate,
      createdBy: payment.createdBy,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    if (payment.type === "donation" || payment.type === "contribution") {
      const totalAmountPaid = payment.members.reduce(
        (sum, member) => sum + (member.amountPaid || 0),
        0
      );

      responseData.totalAmountPaid = totalAmountPaid;
      responseData.members = payment.members.map((member) => ({
        userId: member.userId?._id,
        fullName: member.userId?.fullName || "Unnamed",
        amountPaid: member.amountPaid || 0,
        paid: member.paid || false, // 🔹 include paid for consistency
      }));
    } else if (payment.type === "required") {
      const paidCount = payment.members.filter((m) => m.paid).length;
      const totalAmount = paidCount * (payment.amount || 0);

      responseData.totalAmount = totalAmount;
      responseData.members = payment.members.map((member) => ({
        userId: member.userId?._id,
        fullName: member.userId?.fullName || "Unnamed",
        paid: member.paid || false,
        amountPaid: member.amountPaid || 0, // 🔹 add this too for tracking
      }));
    }

    return res.status(200).json({ payment: responseData });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching payment." });
  }
};

export const manageFetchEditPayment = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId) || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId }).populate("members.userId", "fullName email");
    if (!payment) return res.status(404).json({ message: "Payment not found." });

    const allUsers = await UserModel.find({ group: currentGroupId }, "fullName email");
    const members = allUsers.map((user) => {
      const memberRecord = payment.members.find((m) => m.userId && m.userId._id.toString() === user._id.toString());
      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        selected: !!memberRecord,
        paid: memberRecord ? memberRecord.paid : false,
        amountPaid: memberRecord ? memberRecord.amountPaid : 0,
      };
    });

    res.status(200).json({
      payment: {
        _id: payment._id,
        title: payment.title,
        description: payment.description,
        amount: payment.amount,
        dueDate: payment.dueDate,
        type: payment.type,
        published: payment.published,
        createdBy: payment.createdBy,
        members,
      },
    });
  } catch (error) {
    console.error("Fetch Edit Payment Error:", error);
    res.status(500).json({ message: "Server error while fetching payment." });
  }
};

export const manageEditPayment = async (req, res) => {
  const { id } = req.params;
  const { title, description, amount, dueDate, type, published, members } = req.body;
  const { currentGroupId } = req.user;

  try {
    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId });
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // ✅ Only overwrite members if a non-empty array is provided
    if (Array.isArray(members) && members.length > 0) {
      const userIds = members.map((m) => (typeof m === 'object' ? m.userId : m));

      const validUsers = await UserModel.find({ _id: { $in: userIds } }).select('_id');
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: 'One or more selected users are invalid.' });
      }

      const existingMap = new Map(
        (payment.members || []).map((m) => [
          m.userId.toString(),
          { paid: m.paid, amountPaid: m.amountPaid },
        ])
      );

      payment.members = userIds.map((uid) => {
        const incoming = members.find(
          (m) => (typeof m === 'object' ? m.userId : m).toString() === uid.toString()
        );

        return {
          userId: uid,
          paid:
            incoming?.paid !== undefined
              ? !!incoming.paid
              : existingMap.get(uid.toString())?.paid || false,
          amountPaid:
            incoming?.amountPaid !== undefined
              ? Number(incoming.amountPaid)
              : existingMap.get(uid.toString())?.amountPaid || 0,
        };
      });
    }

    if (title !== undefined) payment.title = title;
    if (description !== undefined) payment.description = description;
    if (amount !== undefined) payment.amount = Number(amount);
    if (dueDate !== undefined) payment.dueDate = dueDate;
    if (type !== undefined) payment.type = type;
    if (published !== undefined) payment.published = published;

    await payment.save();
    res.status(200).json({
      message: 'Payment updated successfully.',
      payment,
    });
  } catch (error) {
    console.error('manageEditPayment Error:', error);
    res.status(500).json({ message: 'Server error while updating payment.' });
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
      message: `Updated ${updateResult.modifiedCount} member${updateResult.modifiedCount > 1 ? 's' : ''} as ${paid ? "paid" : "unpaid"
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

    res.status(200).json({ message: `Updated ${updateResult.modifiedCount} member${updateResult.modifiedCount > 1 ? 's' : ''} as unpaid.` });
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
    // 1. Load group with members
    const group = await GroupModel.findById(currentGroupId)
      .populate("members.user", "fullName email");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // 2. Load payment
    const payment = await PaymentModel.findOne({
      _id: paymentId,
      group: currentGroupId,
    });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this group." });
    }

    // 3. Map group members with payment info
    const membersWithStatus = group.members.map((member) => {
      const record = payment.members.find(
        (m) => m.userId.toString() === member.user._id.toString()
      );

      return {
        _id: member.user._id,
        fullName: member.user.fullName,
        email: member.user.email,
        memberNumber: member.memberNumber,
        status: member.status,
        attached: !!record,             // for checkboxes
        paid: record ? record.paid : false,
        amountPaid: record ? record.amountPaid : 0,
      };
    });

    return res.status(200).json({ members: membersWithStatus });
  } catch (error) {
    console.error("Error fetching payment members:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const manageUpdateDonationPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { members, ...rest } = req.body;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: 'Invalid ID(s) format.' });
    }

    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (payment.type !== "donation") {
      return res.status(400).json({ message: "Not a donation payment" });
    }

    if (Array.isArray(members) && members.length > 0) {
      // Normalize userIds
      const userIds = members.map((m) =>
        typeof m === "object" ? m.userId.toString() : m.toString()
      );

      // Validate users exist
      const validUsers = await UserModel.find({ _id: { $in: userIds } }).select("_id");
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: "One or more selected users are invalid." });
      }

      // Start with existing members
      const updatedMembers = [...payment.members.map((m) => m.toObject())];

      members.forEach((incoming) => {
        const userId =
          typeof incoming === "object" ? incoming.userId.toString() : incoming.toString();
        const amountPaid =
          typeof incoming === "object" && incoming.amountPaid !== undefined
            ? Number(incoming.amountPaid)
            : 0;

        const existingIndex = updatedMembers.findIndex((m) => m.userId.toString() === userId);

        if (existingIndex >= 0) {
          // Update existing record
          updatedMembers[existingIndex] = {
            ...updatedMembers[existingIndex],
            amountPaid,
            paid: amountPaid > 0,
          };
        } else {
          // Add new record
          updatedMembers.push({
            userId,
            amountPaid,
            paid: amountPaid > 0,
          });
        }
      });

      payment.members = updatedMembers;
    }

    // Apply other updates (title, description, etc.)
    Object.assign(payment, rest);

    await payment.save();
    res.json({message: 'Donation updated successfully!'});
  } catch (err) {
    console.error("Error updating donation payment:", err);
    res.status(500).json({ message: err.message });
  }
};

export const manageUpdateRequiredPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { members, ...rest } = req.body;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: 'Invalid ID(s) format.' });
    }

    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.type !== "required")
      return res.status(400).json({ message: "Not a required payment" });

    // ✅ Only update members if a non-empty array is provided
    if (Array.isArray(members) && members.length > 0) {
      const userIds = members.map((m) => (typeof m === "object" ? m.userId : m));

      // validate users
      const validUsers = await UserModel.find({ _id: { $in: userIds } }).select("_id");
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: "One or more selected users are invalid." });
      }

      // preserve existing paid/amountPaid if not provided
      const existingMap = new Map(
        (payment.members || []).map((m) => [
          m.userId.toString(),
          { paid: m.paid, amountPaid: m.amountPaid },
        ])
      );

      payment.members = userIds.map((uid) => {
        const incoming = members.find(
          (m) => (typeof m === "object" ? m.userId : m).toString() === uid.toString()
        );

        return {
          userId: uid,
          paid:
            incoming?.paid !== undefined
              ? !!incoming.paid
              : existingMap.get(uid.toString())?.paid || false,
          amountPaid:
            incoming?.amountPaid !== undefined
              ? Number(incoming.amountPaid)
              : existingMap.get(uid.toString())?.amountPaid || 0,
        };
      });
    }

    Object.assign(payment, rest);
    await payment.save();

    res.json({message: 'Payment updated successfully!'});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const manageUpdateContributionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { members, ...rest } = req.body;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: 'Invalid ID(s) format.' });
    }

    const payment = await PaymentModel.findOne({ _id: id, group: currentGroupId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (payment.type !== "contribution") {
      return res.status(400).json({ message: "Not a contribution payment" });
    }

    if (Array.isArray(members) && members.length > 0) {
      // Normalize userIds from members payload
      const userIds = members.map((m) =>
        typeof m === "object" ? m.userId.toString() : m.toString()
      );

      // Validate users exist in DB
      const validUsers = await UserModel.find({ _id: { $in: userIds } }).select("_id");
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: "One or more selected users are invalid." });
      }

      // Build updated member list
      const updatedMembers = [...payment.members.map((m) => m.toObject())];

      members.forEach((incoming) => {
        const userId = typeof incoming === "object" ? incoming.userId.toString() : incoming.toString();
        const amountPaid = typeof incoming === "object" && incoming.amountPaid !== undefined
          ? Number(incoming.amountPaid)
          : 0;

        const existingIndex = updatedMembers.findIndex((m) => m.userId.toString() === userId);

        if (existingIndex >= 0) {
          // Update existing
          updatedMembers[existingIndex] = {
            ...updatedMembers[existingIndex],
            amountPaid,
            paid: amountPaid > 0,
          };
        } else {
          // Add new
          updatedMembers.push({
            userId,
            amountPaid,
            paid: amountPaid > 0,
          });
        }
      });

      payment.members = updatedMembers;
    }

    // Update other payment fields (title, description, etc.)
    Object.assign(payment, rest);

    await payment.save();
    res.json({message: 'Contribution updated successfully!'});
  } catch (err) {
    console.error("Error updating contribution payment:", err);
    res.status(500).json({ message: err.message });
  }
};