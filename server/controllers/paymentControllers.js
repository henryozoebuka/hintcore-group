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

    return res.status(201).json({ message: `${paymentData.type[0].toUpperCase() + newPayment.type.slice(1)} created successfully.` });
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

export const manageSearchPayments = async (req, res) => {
  try {
    const { titleOrContent, types, startDate, endDate, page = 1, limit = 10 } = req.query;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // 🟢 Build query
    let query = { group: currentGroupId };

    // Title or Content search
    if (titleOrContent) {
      query.$or = [
        { title: { $regex: titleOrContent, $options: "i" } },
        { content: { $regex: titleOrContent, $options: "i" } },
      ];
    }

    // Types (array of multiple)
    if (types) {
      const typeArray = types.split(",").map((t) => t.trim().toLowerCase());
      if (typeArray.length > 0) {
        query.type = { $in: typeArray };
      }
    }

    // 🟢 Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        // include the whole day for endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      PaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PaymentModel.countDocuments(query),
    ]);

    return res.status(200).json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Search Payments Error:", error);
    return res.status(500).json({ message: "An error occurred while searching payments." });
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

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
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
    
    res.status(200).json({ message: `${payment.title[0].toUpperCase() + payment.title.slice(1)} updated successfully!` });
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

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
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

    res.status(200).json({ message: `${payment.title[0].toUpperCase() + payment.title.slice(1)} updated successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const manageUpdateContributionPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { members, ...rest } = req.body;
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
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
    res.status(200).json({ message: `${payment.title[0].toUpperCase() + payment.title.slice(1)} updated successfully!` });
  } catch (err) {
    console.error("Error updating contribution payment:", err);
    res.status(500).json({ message: err.message });
  }
};

export const manageDeletePayment = async (req, res) => {
  const { id } = req.params;
  const { userId, currentGroupId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    // 🔒 Ensure payment belongs to the same group
    if (payment.group.toString() !== currentGroupId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this payment." });
    }

    await payment.deleteOne();

    return res.status(200).json({ message: "Payment deleted successfully." });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    return res.status(500).json({ message: "An error occurred while deleting the payment." });
  }
};

export const manageDeletePayments = async (req, res) => {
  try {
    // return console.log(req.body)
    const { ids } = req.body;
    const { currentGroupId } = req.user;

    // Basic checks
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No payment IDs provided." });
    }

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID in token." });
    }

    // Validate each incoming id
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "One or more provided payment IDs are invalid.",
        invalidIds,
      });
    }

    // Ensure group exists
    const group = await GroupModel.findById(currentGroupId).select("_id");
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Convert to ObjectId instances
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    // Find payments that match the requested ids AND belong to this group
    const paymentsInGroup = await PaymentModel.find({
      _id: { $in: objectIds },
      group: currentGroupId,
    }).select("_id");

    if (!paymentsInGroup || paymentsInGroup.length === 0) {
      return res.status(404).json({
        message: "No matching payments found that belong to your group.",
      });
    }

    const toDeleteIds = paymentsInGroup.map((p) => p._id);

    // Perform deletion (only for payments in the user's group)
    const deleteResult = await PaymentModel.deleteMany({ _id: { $in: toDeleteIds } });

    const deletedCount = deleteResult.deletedCount || 0;

    return res.status(200).json({
      message: `${deletedCount} payment${deletedCount > 1 ? 's' : ''} deleted successfully.`,
      deletedCount,
    });
  } catch (err) {
    console.error("Error deleting payments:", err);
    return res.status(500).json({ message: "Server error. Failed to delete payments." });
  }
};

export const manageSearchAccounts = async (req, res) => {
  try {
    const {
      titleOrContent = "",
      types = "",
      startDate = "",
      endDate = "",
      dueStart = "",
      dueEnd = "",
      published = "",
      createdBy = "", // now treated as creator fullName (string)
      paymentStatus = "",
      exportCsv = false,
      page = 1,
      limit = 10,
    } = req.query;

    const exportCsvBool = String(exportCsv) === "true";
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const { currentGroupId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid group ID." });
    }

    const group = await GroupModel.findById(currentGroupId).lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Base query
    const query = { group: currentGroupId };
    const andConditions = [];

    // Title or Description (partial, case-insensitive)
    if (titleOrContent && titleOrContent.trim() !== "") {
      const q = titleOrContent.trim();
      andConditions.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
        ],
      });
    }

    // Types (csv string -> array)
    if (types && types.trim() !== "") {
      const typeArray = types.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (typeArray.length > 0) andConditions.push({ type: { $in: typeArray } });
    }

    // CreatedAt range
    if ((startDate && startDate !== "") || (endDate && endDate !== "")) {
      const createdAt = {};
      if (startDate && startDate !== "") createdAt.$gte = new Date(startDate);
      if (endDate && endDate !== "") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.$lte = end;
      }
      andConditions.push({ createdAt });
    }

    // DueDate range
    if ((dueStart && dueStart !== "") || (dueEnd && dueEnd !== "")) {
      const dueDate = {};
      if (dueStart && dueStart !== "") dueDate.$gte = new Date(dueStart);
      if (dueEnd && dueEnd !== "") {
        const end = new Date(dueEnd);
        end.setHours(23, 59, 59, 999);
        dueDate.$lte = end;
      }
      andConditions.push({ dueDate });
    }

    // Published
    if (published !== "") {
      andConditions.push({ published: published === "true" });
    }

    // createdBy: treat as fullName string (partial, case-insensitive)
    if (createdBy && createdBy.trim() !== "") {
      // find user(s) with matching fullName
      const matchedUsers = await UserModel.find({
        fullName: { $regex: createdBy.trim(), $options: "i" },
      })
        .select("_id")
        .lean();

      if (!matchedUsers || matchedUsers.length === 0) {
        // No matching creators -> return empty result immediately
        return res.status(200).json({
          payments: [],
          total: 0,
          totalPages: exportCsvBool ? 1 : 0,
          currentPage: exportCsvBool ? 1 : pageNum,
        });
      }

      const userIds = matchedUsers.map((u) => u._id);
      andConditions.push({ createdBy: { $in: userIds } });
    }

    // Payment status (any member paid/unpaid)
    if (paymentStatus && paymentStatus !== "") {
      if (paymentStatus === "unpaid") {
        andConditions.push({ "members.paid": false });
      } else if (paymentStatus === "paid") {
        andConditions.push({ "members.paid": true });
      }
    }

    // Apply AND conditions
    if (andConditions.length > 0) query.$and = andConditions;

    // Build query + populate members and creator fullName
    const baseQuery = PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName") // creator fullName
      .populate("members.userId", "fullName email"); // member info

    // Pagination if not export
    let payments;
    if (exportCsvBool) {
      payments = await baseQuery.exec();
    } else {
      payments = await baseQuery.skip((pageNum - 1) * limitNum).limit(limitNum).exec();
    }

    const total = exportCsvBool ? payments.length : await PaymentModel.countDocuments(query);

    // Build response with computed totals and correct createdBy fullName
    const paymentsWithSummary = payments.map((p) => {
      const members = Array.isArray(p.members) ? p.members : [];
      const totalPaidMembers = members.filter((m) => m.paid).length;
      const totalUnpaidMembers = members.filter((m) => !m.paid).length;
      const totalAmountPaid = members.reduce((sum, m) => sum + (m.amountPaid || 0), 0);

      return {
        _id: p._id,
        title: p.title,
        description: p.description,
        type: p.type,
        dueDate: p.dueDate || null,
        published: p.published,
        createdBy: p.createdBy?.fullName || "",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        amount: p.amount || 0,
        totalPaidMembers,
        totalUnpaidMembers,
        totalAmountPaid,
      };
    });

    return res.status(200).json({
      payments: paymentsWithSummary,
      total,
      totalPages: exportCsvBool ? 1 : Math.ceil(total / limitNum),
      currentPage: exportCsvBool ? 1 : pageNum,
    });
  } catch (error) {
    console.error("Search Accounts Error:", error);
    return res.status(500).json({ message: "An error occurred while searching accounts." });
  }
};

export const manageAccount = async (req, res) => {
  const { id } = req.params;
  const { currentGroupId } = req.user;

  if (!id) {
    return res.status(400).json({ message: "Account ID is required." });
  }

  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(currentGroupId)
  ) {
    return res.status(400).json({ message: "Invalid ID(s) format." });
  }

  try {
    const account = await PaymentModel.findOne({
      _id: id,
      group: currentGroupId,
    })
      .populate("group", "name")
      .populate("members.userId", "fullName")
      .populate("createdBy", "fullName");

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Base response
    let responseData = {
      _id: account._id,
      title: account.title,
      description: account.description,
      amount: account.amount,
      type: account.type,
      published: account.published,
      dueDate: account.dueDate,
      createdBy: account.createdBy,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      // group: account.group,
    };

    // Members + totals depending on type
    if (account.type === "donation" || account.type === "contribution") {
      const totalAmountPaid = account.members.reduce(
        (sum, member) => sum + (member.amountPaid || 0),
        0
      );

      responseData.totalAmountPaid = totalAmountPaid;
      responseData.members = account.members.map((member) => ({
        fullName: member.userId?.fullName || "Unnamed",
        amountPaid: member.amountPaid || 0,
        paid: member.paid || false,
      }));
    } else if (account.type === "required") {
      const paidCount = account.members.filter((m) => m.paid).length;
      const totalAmount = paidCount * (account.amountPaid || 0);

      responseData.totalAmount = totalAmount;
      responseData.members = account.members.map((member) => ({
        fullName: member.userId?.fullName || "Unnamed",
        paid: member.paid || false,
        amountPaid: member.amountPaid || 0,
      }));
    } else {
      // fallback in case type isn't matched
      responseData.members = account.members.map((member) => ({
        fullName: member.userId?.fullName || "Unnamed",
        // paid: member.paid || false,
        amountPaid: member.amountPaid || 0,
      }));
    }

    // Final response
    return res.status(200).json({ account: responseData });
  } catch (error) {
    console.error("Error fetching account:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching account." });
  }
};