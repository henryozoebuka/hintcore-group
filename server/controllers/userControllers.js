import mongoose from "mongoose";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import UserModel from "../models/userModel.js";
import UserOTPVerificationModel from "../models/userOTPVerificationModel.js";
import GroupModel from "../models/groupModel.js";
import AnnouncementModel from "../models/announcementModel.js";

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

export const confirmOTP = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    // 1. Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 2. Find OTP record
    const otpRecord = await UserOTPVerificationModel.findOne({ userId });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // 3. Check if expired
    if (new Date(otpRecord.expiryDate) < new Date()) {
      await UserOTPVerificationModel.deleteMany({ userId }); // cleanup expired OTP
      return res.status(407).json({ message: 'OTP has expired. Login with your email to generate a new one.' });
    }

    // 4. Validate OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.OTP);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // 5. Mark user as verified
    user.verified = true;
    await user.save();

    // 6. Remove OTP record after success
    await UserOTPVerificationModel.deleteMany({ userId });

    return res.status(200).json({ message: 'OTP verified successfully. You can now log in.' });

  } catch (error) {
    console.error('OTP Confirmation Error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP confirmation.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 🔹 Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    // 🔹 Handle if user is not verified yet
    if (user.verified === false) {
      if (user.OTPNumberOfAttempts > 4) {
        return res.status(403).json({ message: 'You have exhausted your OTP attempts. Contact the admin.' })
      }

      // Delete existing OTPs
      await UserOTPVerificationModel.deleteMany({ userId: user._id });

      // Generate OTP
      const generateOTP = crypto.randomInt(100000, 1000000);
      const formattedOTP = generateOTP.toString().padStart(6, '0');
      const OTPSalt = await bcrypt.genSalt(10);
      const hashedOTP = await bcrypt.hash(formattedOTP, OTPSalt);

      // Save OTP
      const verificationOTP = await UserOTPVerificationModel.create({
        userId: user._id,
        OTP: hashedOTP
      });

      if (!verificationOTP) {
        return res.status(500).json({ message: 'Error creating OTP verification document.' });
      }

      // Send OTP Email
      const mailOptions = {
        to: user.email,
        from: 'info@hintcoregroup.com',
        subject: 'Verification OTP from hintcoregroup.com',
        html: `<p>This is your OTP: <strong>${generateOTP}</strong>.</p>
               <p>Use before it expires.</p>`
      }

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(500).json({ message: err.message })
        }
        console.log('Email sent: ', info?.accepted || info?.rejected || 'No status available');
      });

      return res.status(202).json({ userId: user._id });
    }

    // 🔹 Verify password
    const verifyUser = await bcrypt.compare(password, user.password);
    if (!verifyUser) {
      return res.status(400).json({ message: 'Invalid login details.' });
    }

    // Reset OTP attempts if successful login
    if (user.OTPNumberOfAttempts !== 0) {
      user.OTPNumberOfAttempts = 0;
      await user.save();
    }

    // 🔹 Get the current group of the user
    const currentGroup = await GroupModel.findById(user.currentGroup);
    if (!currentGroup) {
      return res.status(400).json({ message: "No group found for your account." });
    }

    // ✅ Get only THIS USER's permissions for the current group
    const userGroupData = user.groups.find(
      gp => gp.group.toString() === currentGroup._id.toString()
    );

    const userPermissions = userGroupData?.permissions ?? [];

    // 🔹 Generate JWT with only user-specific permissions in that group
    const token = jwt.sign(
      {
        userId: user._id,
        currentGroupId: currentGroup._id,
        permissions: userPermissions
      },
      process.env.JWT_PASSWORD,
      { expiresIn: '1d' }
    );

    const groupName = currentGroup.name;

    res.status(200).json({
      groupName,
      message: 'Logged In Successfully!',
      token
    });

  } catch (error) {
    console.error('Error occurred at the backend.', error);
    res.status(500).json({ message: 'Error occurred at the backend.' });
  }
};

export const userProfile = async (req, res) => {
  try {
    const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "User ID is required" });
  }

    // 2️⃣ Fetch user and populate groups
    const user = await UserModel.findById(userId)
      .populate({
        path: 'groups.group',
        select: 'name description imageUrl', // Group fields to show
      })
      .select('-password -OTPNumberOfAttempts -groups'); // Hide sensitive fields

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Return profile
    res.status(200).json({user});

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const userProfileEdit = async (req, res) => {
  try {
    const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "User ID is required" });
  }

    // 2️⃣ Fetch user and populate groups
    const user = await UserModel.findById(userId)
      .select('-password -OTPNumberOfAttempts -groups'); // Hide sensitive fields

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Return profile
    res.status(200).json({user});

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const {
      fullName,
      phoneNumber,
      bio,
      gender,
      oldPassword,
      password,
    } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update basic profile fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio;
    if (gender) user.gender = gender;

    // If password change is requested
    if (oldPassword || password) {
      if (!oldPassword || !password) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Server error while updating profile' });
  }
};

export const userDashboardData = async (req, res) => {
  const { userId, currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const user = await UserModel.findById(userId).select("fullName");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const announcements = await AnnouncementModel.find({ 
      group: currentGroupId, 
      published: true 
    })
    .select('title createdAt')
    .sort({ createdAt: -1 })
    .limit(3);

    return res.status(200).json({ fullName: user.fullName, announcements });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "An error occurred while fetching data" });
  }
};

export const userGroups = async (req, res) => {
  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const user = await UserModel.findById(userId).populate('groups.group');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract group details from populated groups
    const groupData = user.groups.map(g => ({
      _id: g.group._id,
      name: g.group.name,
      status: g.status,
    }));

    res.status(200).json({ groups: groupData });
  } catch (error) {
    console.error('Error fetching user groups', error);
    res.status(500).json({ message: "Error fetching your groups." });
  }
};

export const manageSearchedUsers = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }
  const {
    fullName,
    email,
    permission,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const group = await GroupModel.findById(currentGroupId).populate({
      path: 'members.user',
      select: '_id',
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Step 1: Filter member IDs by permission if provided
    let memberIds = group.members
      .filter(m => m.user && (!permission || m.permissions.includes(permission)))
      .map(m => m.user._id);

    if (!memberIds.length) {
      return res.status(200).json({ users: [], totalPages: 0 });
    }

    // Step 2: Build search query
    const query = {
      _id: { $in: memberIds },
    };

    if (fullName?.trim()) {
      query.fullName = { $regex: fullName.trim(), $options: "i" };
    }

    if (email?.trim()) {
      query.email = { $regex: email.trim(), $options: "i" };
    }

    // Step 3: Count + Pagination
    const total = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select('_id fullName email phoneNumber')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const manageUsers = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const group = await GroupModel.findById(currentGroupId)
      .populate({
        path: 'members.user',
        select: '_id fullName email phoneNumber role',
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const totalMembers = group.members.length;
    const totalPages = Math.ceil(totalMembers / limit);

    const start = (page - 1) * limit;
    const end = page * limit;

    const paginatedMembers = group.members.slice(start, end).map((member) => {
      const user = member.user;
      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };
    });

    res.status(200).json({
      users: paginatedMembers,
      totalPages,
    });

  } catch (error) {
    console.error('Fetch group members failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};