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

const permissions = ['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions', 'manage_expenses', 'manage_payments', 'expenses']
const MAX_ATTEMPTS = 5;
const COOLDOWN_MINUTES = 60;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

const generateAndHashOTP = async (saltRounds = 10) => {
  const otp = crypto.randomInt(100000, 1000000).toString(); // 6-digit
  const hashedOTP = await bcrypt.hash(otp, saltRounds);
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

export const confirmOTPForPasswordReset = async (req, res) => {
  const { otp, password } = req.body;
  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID in token.' });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is blocked
    if (user.OTPBlockedUntil && user.OTPBlockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.OTPBlockedUntil - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many OTP attempts. Try again in ${waitMinutes} minutes.` });
    }

    const otpRecord = await UserOTPVerificationModel.findOne({ userId });
    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // Check OTP expiry
    if (new Date(otpRecord.expiryDate) < new Date()) {
      await UserOTPVerificationModel.deleteMany({ userId });
      return res.status(410).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Compare OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.OTP);
    if (!isOTPValid) {
      user.OTPNumberOfAttempts += 1;

      if (user.OTPNumberOfAttempts >= MAX_ATTEMPTS) {
        user.OTPBlockedUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000);
        user.OTPNumberOfAttempts = 0; // reset after blocking
      }

      await user.save();
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Reset password and verification flags
    user.password = await bcrypt.hash(password, 10);
    user.verified = true;
    user.OTPNumberOfAttempts = 0;
    user.OTPBlockedUntil = null;
    await user.save();

    await UserOTPVerificationModel.deleteMany({ userId });

    return res.status(200).json({ message: 'OTP verified. Password reset successful. You can now log in.' });

  } catch (error) {
    console.error('OTP Confirmation Error:', error);
    return res.status(500).json({ message: 'Internal server error during OTP confirmation.' });
  }
};

export const login = async (req, res) => {
  const { email, password, deviceToken } = req.body;
  try {
    // 🔹 Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User does not exist' });
    }

    // 🔹 Handle if user is not verified yet
    if (user.verified === false) {
      if (user.OTPBlockedUntil && user.OTPBlockedUntil > new Date()) {
        const waitMinutes = Math.ceil((user.OTPBlockedUntil - Date.now()) / 60000);
        return res.status(429).json({ message: `You have not confirmed your OTP and you have too many OTP attempts. Try again in ${waitMinutes} minutes.` });
      }

      if (user.OTPBlockedUntil && user.OTPBlockedUntil < new Date()) {
        await UserOTPVerificationModel.deleteMany({ userId: user._id });
        const { formattedOTP: otp, hashedOTP } = generateAndHashOTP();
        const verificationOTP = await UserOTPVerificationModel.create({
          userId: user._id,
          OTP: hashedOTP
        });

        if (!verificationOTP) {
          return res.status(500).json({ message: 'Error creating OTP verification document.' });
        }
        const otpToken = jwt.sign({ userId: user._id }, process.env.JWT_PASSWORD, { expiresIn: '1d' });

        // Send OTP Email
        const mailOptions = {
          to: user.email,
          from: 'info@hintcore.com.ng',
          subject: 'Your Hintcore OTP',
          html: `
        <p>Hello,</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this message.</p>
        <br/>
        <p>Hintcore Team</p>
      `
        };

        await transporter.sendMail(mailOptions);

        return res.status(409).json({ otpToken, message: `You have not confirmed your OTP. Please check your email to confirm your OTP.` });
      }
    }

    // 🔹 Verify password
    const verifyUser = await bcrypt.compare(password, user.password);
    if (!verifyUser) {
      return res.status(400).json({ message: 'Invalid login details.' });
    }
    let shouldSave = false;
    // Reset OTP attempts if successful login
    if (user.OTPNumberOfAttempts !== 0) {
      user.OTPNumberOfAttempts = 0;
      shouldSave = true;
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

    if (deviceToken && !user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }

    // 🔹 Generate JWT with only user-specific permissions in that group
    const token = jwt.sign(
      {
        userId: user._id,
        currentGroupId: currentGroup._id,
        permissions: userPermissions,
        userRole: user.userRole,
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please create or join a group to have an account.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact Hintcore Group.' });
    }

    // Check if user is blocked
    if (user.OTPBlockedUntil && new Date(user.OTPBlockedUntil) > new Date()) {
      const waitTime = Math.ceil((new Date(user.OTPBlockedUntil) - Date.now()) / (60 * 1000));
      return res.status(429).json({ message: `Too many attempts. Try again in ${waitTime} minute(s).` });
    }

    // Check number of attempts
    if (user.OTPNumberOfAttempts >= MAX_ATTEMPTS) {
      user.OTPBlockedUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000);
      user.OTPNumberOfAttempts = 0; // Reset counter
      await user.save();

      return res.status(429).json({ message: `Too many OTP attempts. Try again in ${COOLDOWN_MINUTES} minutes.` });
    }

    // Remove old OTPs
    await UserOTPVerificationModel.deleteMany({ userId: user._id });

    const { formattedOTP: otp, hashedOTP } = await generateAndHashOTP();

    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    const savedOTP = await UserOTPVerificationModel.create({
      userId: user._id,
      OTP: hashedOTP,
      expiryDate
    });

    if (!savedOTP) {
      return res.status(500).json({ message: 'Failed to save OTP record.' });
    }

    // Increment attempts
    user.OTPNumberOfAttempts += 1;
    await user.save();

    // Token for confirm step
    const token = jwt.sign({ userId: user._id }, process.env.JWT_PASSWORD, { expiresIn: '10m' });

    const mailOptions = {
      to: user.email,
      from: 'info@hintcore.com.ng',
      subject: 'Your Hintcore OTP',
      html: `
        <p>Hello,</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this message.</p>
        <br/>
        <p>Hintcore Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ token, otpTime: .2, message: 'Your OTP has been sent to your email.' });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const profile = async (req, res) => {
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
    res.status(200).json({ user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const manageProfile = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 2️⃣ Fetch user and populate groups
    const user = await UserModel.findById(id)
      .populate({
        path: 'groups.group',
        select: 'name description imageUrl', // Group fields to show
      })
      .select('-password'); // Hide sensitive fields

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Return profile
    res.status(200).json({ user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const fetchEditProfile = async (req, res) => {
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
    res.status(200).json({ user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const manageFetchEditProfile = async (req, res) => {
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
    res.status(200).json({ user });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
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

export const manageUpdateProfile = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID in token" });
  }

  try {
    const {
      fullName,
      email,
      phoneNumber,
      bio,
      gender,
      imageUrl,
      verified,
      userRole
    } = req.body;

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Check email update only if different
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await UserModel.findOne({ email: email.toLowerCase() });
      if (!emailExists) {
        user.email = email.toLowerCase();
      }
    }

    // ✅ Only update other fields if provided
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio;
    if (gender !== undefined) user.gender = gender;
    if (imageUrl !== undefined) user.imageUrl = imageUrl;
    if (verified !== undefined) user.verified = verified;
    if (userRole !== undefined) user.userRole = userRole;

    await user.save();

    return res.json({ message: 'User profile updated successfully' });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({ message: 'Email already in use by another account.' });
    }

    console.error('Update user profile error:', err);
    return res.status(500).json({ message: 'Server error while updating user profile' });
  }
};

export const manageUsers = async (req, res) => {
  // const { userRole } = req.user;

  // if (!userRole || userRole !== 'super_admin') {
  //   return res.status(403).json({ message: "You don't have permissions to access this page" });
  // }
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const users = await UserModel.find()
    .select('fullName email createdAt')
      .lean();

    if (!users) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);

    const start = (page - 1) * limit;
    const end = page * limit;

    const paginatedUsers = users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(start, end)

    res.status(200).json({
      users: paginatedUsers,
      totalPages,
    });

  } catch (error) {
    console.error('Fetch users failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const userDashboardData = async (req, res) => {
  const { userId, currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  try {
    const user = await UserModel.findById(userId).select("fullName").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const group = await GroupModel.findById(currentGroupId).select("imageUrl").lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const announcements = await AnnouncementModel.find({
      group: currentGroupId,
      published: true
    })
      .select('title createdAt')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.status(200).json({
      user: { fullName: user.fullName },
      group: { imageUrl: group.imageUrl },
      announcements
    });
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

export const manageGetUserGroups = async (req, res) => {
  const { id } = req.params;
  // const { userRole } = req.user;

  // if (!userRole || userRole !== 'super_admin') {
  //   return res.status(403).json({ message: "You don't have permissions to access this page" });
  // }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await UserModel.findById(id).populate('groups.group');

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

export const manageSearchedMembers = async (req, res) => {
  const { currentGroupId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(currentGroupId)) {
    return res.status(400).json({ message: "Invalid IDs in token" });
  }

  const {
    fullName,
    email,
    memberNumber,
    permissions,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    // Get group with members
    const group = await GroupModel.findById(currentGroupId).populate({
      path: "members.user",
      select: "_id fullName email phoneNumber",
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Parse permissions if provided
    let selectedPermissions = [];
    if (permissions) {
      selectedPermissions = permissions.split(",").map((p) => p.trim());
    }

    // Step 1: Filter members in group by permission + memberNumber
    let filteredMembers = group.members.filter((m) => {
      if (!m.user) return false;

      // Permission filter
      if (selectedPermissions.length > 0) {
        if (!m.permissions.some((p) => selectedPermissions.includes(p))) {
          return false;
        }
      }

      // MemberNumber filter
      if (memberNumber?.trim()) {
        const regex = new RegExp(memberNumber.trim(), "i");
        if (!regex.test(m.memberNumber)) {
          return false;
        }
      }

      return true;
    });

    if (!filteredMembers.length) {
      return res.status(200).json({ users: [], totalPages: 0 });
    }

    const memberIds = filteredMembers.map((m) => m.user._id);

    // Step 2: Build user query
    const query = { _id: { $in: memberIds } };

    if (fullName?.trim()) {
      query.fullName = { $regex: fullName.trim(), $options: "i" };
    }

    if (email?.trim()) {
      query.email = { $regex: email.trim(), $options: "i" };
    }

    // Step 3: Count + Pagination
    const total = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select("_id fullName email phoneNumber")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Step 4: Attach memberNumber to returned users
    const membersWithMemberNumbers = users.map((user) => {
      const memberInfo = filteredMembers.find(
        (m) => m.user._id.toString() === user._id.toString()
      );
      return {
        ...user.toObject(),
        memberNumber: memberInfo?.memberNumber || null,
      };
    });

    res.status(200).json({
      members: membersWithMemberNumbers,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const manageMembers = async (req, res) => {
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
        select: 'fullName',
      }).lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const totalMembers = group.members.length;
    const totalPages = Math.ceil(totalMembers / limit);

    const start = (page - 1) * limit;
    const end = page * limit;

    const paginatedMembers = group.members.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(start, end).map((member) => {
      const user = member.user;
      return {
        _id: user._id,
        fullName: user.fullName,
        memberNumber: member.memberNumber
      };
    });

    res.status(200).json({
      members: paginatedMembers,
      permissions,
      totalPages,
    });

  } catch (error) {
    console.error('Fetch group members failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const showMemberNumber = async (req, res) => {
  try {
    const { currentGroupId, userId } = req.user;

    if (!currentGroupId || !userId) {
      return res.status(400).json({ message: "Missing user context" });
    }

    if (!mongoose.Types.ObjectId.isValid(currentGroupId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid IDs in token" });
    }

    const group = await GroupModel.findById(currentGroupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const groupUser = group.members.find(m => m.user.equals(userId));
    if (!groupUser) {
      return res.status(404).json({ message: "Your membership ID not found" });
    }

    res.status(200).json({ memberNumber: groupUser.memberNumber });
  } catch (error) {
    console.error("Error fetching member number:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleGlobalNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for enabled. Must be boolean.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID in token" });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { globalNotificationsEnabled: enabled },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: `Global notifications ${enabled ? 'enabled' : 'disabled'}.`,
      globalNotificationsEnabled: user.globalNotificationsEnabled,
    });
  } catch (error) {
    console.error('Error toggling global notifications:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

export const fetchGlobalNotificationsStatus = async (req, res) => {
  try {
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID in token" });
    }

    // Get notificationsEnabled status for current user
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ globalNotificationsStatus: user.globalNotificationsEnabled });

  } catch (error) {
    console.error("Fetch Global Notifications Status Error:", error);
    return res.status(500).json({
      message: "Internal server error while fetching global notifications status.",
    });
  }
};