import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import UserModel from "../models/userModel.js";
import GroupModel from "../models/groupModel.js";
import UserOTPVerificationModel from "../models/userOTPVerificationModel.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

const generateAndHashOTP = async () => {
  const otp = crypto.randomInt(100000, 1000000).toString(); // 6-digit
  const hashedOTP = await bcrypt.hash(otp, 10);
  return { formattedOTP: otp, hashedOTP };
};

const getMailOptions = (email, otp) => ({
  to: email,
  from: process.env.EMAIL_SENDER,
  subject: "Hintcore Group Verification Code",
  html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
});

export const createGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🧹 Trim string inputs to remove extra spaces
    const {
      groupName: rawGroupName,
      description: rawDescription = "",
      groupPassword: rawGroupPassword,
      fullName: rawFullName,
      userPassword: rawUserPassword,
      email: rawEmail,
      phoneNumber: rawPhoneNumber,
      gender: rawGender,
    } = req.body;

    const groupName = typeof rawGroupName === "string" ? rawGroupName.trim() : rawGroupName;
    const description = typeof rawDescription === "string" ? rawDescription.trim() : rawDescription;
    const groupPassword = typeof rawGroupPassword === "string" ? rawGroupPassword.trim() : rawGroupPassword;
    const fullName = typeof rawFullName === "string" ? rawFullName.trim() : rawFullName;
    const userPassword = typeof rawUserPassword === "string" ? rawUserPassword.trim() : rawUserPassword;
    const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;
    const phoneNumber = typeof rawPhoneNumber === "string" ? rawPhoneNumber.trim() : rawPhoneNumber;
    const gender = typeof rawGender === "string" ? rawGender.trim() : rawGender;

    // 1️⃣ Required fields check
    if (!groupName || !groupPassword || !fullName || !userPassword || !email || !phoneNumber) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // 2️⃣ Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // 3️⃣ Password length check
    if (userPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // 4️⃣ User existence check
    const existingUser = await UserModel.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(409).json({
        message: "You already have an account, please login to create a new group.",
      });
    }

    // 5️⃣ Unique joinCode generation
    let joinCode;
    do {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await GroupModel.findOne({ joinCode }));

    // 6️⃣ Hash passwords
    const hashedUserPassword = await bcrypt.hash(userPassword, 10);
    const hashedGroupPassword = await bcrypt.hash(groupPassword, 10);

    // 7️⃣ Create user & group
    const [newUser] = await UserModel.create(
      [
        {
          fullName,
          email,
          phoneNumber,
          password: hashedUserPassword,
          gender,
          verified: false,
          groups: [],
        },
      ],
      { session }
    );

    const [newGroup] = await GroupModel.create(
      [
        {
          name: groupName,
          description,
          groupPassword: hashedGroupPassword,
          createdBy: newUser._id,
          joinCode,
          members: [
            {
              user: newUser._id,
              status: "active",
              permissions: ["admin", "manage_users", "manage_announcements", "manage_events"],
            },
          ],
        },
      ],
      { session }
    );

    // 8️⃣ Link group to user
    newUser.groups.push({
      group: newGroup._id,
      status: "active",
      permissions: ["admin", "manage_users", "manage_announcements", "manage_events"],
    });

    // set currentGroup to the first created group
    newUser.currentGroup = newGroup._id;

    await newUser.save({ session });

    // 9️⃣ OTP generation & save
    const { formattedOTP, hashedOTP } = await generateAndHashOTP();
    await UserOTPVerificationModel.create(
      [
        {
          userId: newUser._id,
          OTP: hashedOTP,
          expiryDate: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
      { session }
    );

    // 🔟 Commit transaction before sending email
    await session.commitTransaction();
    session.endSession();

    // 1️⃣1️⃣ Send OTP email (outside transaction)
    try {
      await transporter.sendMail(getMailOptions(email, formattedOTP));
    } catch (mailErr) {
      console.error("Email sending failed:", mailErr);
    }

    return res.status(201).json({
      message: "Group and account created successfully. Please verify your email with the OTP sent.",
      userId: newUser._id,
      joinCode,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("CreateGroup Error:", error);
    return res.status(500).json({ message: "Internal server error during group creation." });
  }
};

export const fetchGroupJoinCode = async (req, res) => {
  const { currentGroupId } = req.user;
  
    if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
      return res.status(400).json({ message: "Invalid IDs in token" });
    }
  try {
    const group = await GroupModel.findById(currentGroupId)
      .select('joinCode');
    if (!currentGroupId) {
      return res.status(404).json({ message: "Group not found." });
    }

    res.status(200).json({
      joinCode: group.joinCode,
    })

  } catch (error) {
    console.error("FetchGroupInfo Error:", error);
    res.status(500).json({ message: "Something went wrong while fetching group information." });
  }
}

export const verifyGroup = async (req, res) => {
  const { joinCode, groupPassword } = req.body;

  try {
    // ✅ Select the groupPassword field explicitly
    const group = await GroupModel.findOne({ joinCode: joinCode.toUpperCase() }).select('+groupPassword');

    const isPasswordValid = group && await bcrypt.compare(groupPassword, group.groupPassword);

    if (!group || !isPasswordValid) {
      return res.status(404).json({ message: "Invalid group credentials." });
    }

    res.status(200).json({
      groupName: group.name,
      message: `${group.name} verified, please fill out your information.`,
    });

  } catch (error) {
    console.error('Error verifying group:', error);
    res.status(500).json({ message: 'Error verifying group.' });
  }
};

export const joinGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      fullName: rawFullName,
      email: rawEmail,
      phoneNumber: rawPhoneNumber,
      password: rawPassword,
      joinCode: rawJoinCode,
    } = req.body;

    const fullName = typeof rawFullName === "string" ? rawFullName.trim() : rawFullName;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;
    const phoneNumber = typeof rawPhoneNumber === "string" ? rawPhoneNumber.trim() : rawPhoneNumber;
    const password = typeof rawPassword === "string" ? rawPassword.trim() : rawPassword;
    const joinCode = typeof rawJoinCode === "string" ? rawJoinCode.trim().toUpperCase() : rawJoinCode;

    if (!fullName || !email || !phoneNumber || !password || !joinCode) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const group = await GroupModel.findOne({ joinCode }).session(session);
    if (!group) {
      return res.status(404).json({ message: "Group not found. Invalid join code." });
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      const isMember = group.members.some(
        (member) => member.user.toString() === existingUser._id.toString()
      );

      if (isMember) {
        return res.status(202).json({
          message: ` You are already a member of ${group.name}. Please login instead.`,
        });
      }

      // Add existing user to group
      group.members.push({
        user: existingUser._id,
        status: "active",
        permissions: ["user"],
      });
      await group.save({ session });

      existingUser.groups.push({
        group: group._id,
        status: "active",
        permissions: ["user"],
      });
      existingUser.currentGroup = group._id;
      await existingUser.save({ session });

      const { formattedOTP, hashedOTP } = await generateAndHashOTP();
      await UserOTPVerificationModel.create(
        [{
          userId: existingUser._id,
          OTP: hashedOTP,
          expiryDate: new Date(Date.now() + 10 * 60 * 1000),
        }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      try {
        await transporter.sendMail(getMailOptions(email, formattedOTP));
      } catch (mailErr) {
        console.error("Email sending failed:", mailErr);
      }

      return res.status(200).json({
        message: "User added to group. Please verify your email.",
        userId: existingUser._id,
        groupId: group._id,
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await UserModel.insertMany([{
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      verified: false,
    }], { session });

    group.members.push({
      user: newUser._id,
      status: "active",
      permissions: ["user"],
    });
    await group.save({ session });

    newUser.groups.push({
      group: group._id,
      status: "active",
      permissions: ["user"],
    });
    newUser.currentGroup = group._id;
    await newUser.save({ session });

    const { formattedOTP, hashedOTP } = await generateAndHashOTP();
    await UserOTPVerificationModel.create([{
      userId: newUser._id,
      OTP: hashedOTP,
      expiryDate: new Date(Date.now() + 10 * 60 * 1000),
    }], { session });

    await session.commitTransaction();
    session.endSession();

    try {
      await transporter.sendMail(getMailOptions(email, formattedOTP));
    } catch (mailErr) {
      console.error("Email sending failed:", mailErr);
    }

    return res.status(201).json({
      message: "Joined group successfully. Please verify your email.",
      userId: newUser._id,
      groupId: group._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("JoinGroup Error:", error);
    return res.status(500).json({ message: "Internal server error during joining group." });
  }
};

export const groupMembers = async (req, res) => {
  const { currentGroupId } = req.user;
    
      if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
          return res.status(400).json({ message: "Invalid IDs in token" });
        }

  try {
    const group = await GroupModel.findById(currentGroupId)
      .select('members')
      .populate('members.user', 'fullName'); // Select only needed user fields

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    const members = group.members
      .filter(member => member.status === 'active') // Optional: only return active users
      .map(member => ({
        _id: member.user._id,
        fullName: member.user.fullName,
      }));

      res.status(200).json({ users: members });
  } catch (error) {
    console.error("Fetch group members Error:", error);
    return res.status(500).json({ message: "Internal server error during fetching group members." });
  }
};