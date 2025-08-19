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