import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import UserModel from "../models/userModel.js";
import UserOTPVerificationModel from "../models/userOTPVerificationModel.js";
import GroupModel from "../models/groupModel.js";

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
        id: user._id,
        groupId: currentGroup._id,
        permissions: userPermissions
      },
      process.env.JWT_PASSWORD,
      { expiresIn: '1d' }
    );

    // 🔹 Clean response
    const userResponse = {
      userId: user._id,
      currentGroupId: currentGroup._id,
      groupName: currentGroup.name,
      permissions: userPermissions
    };

    res.status(200).json({
      user: userResponse,
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
    // 1️⃣ Get userId from auth middleware or query param
    const { id } = req.params; // Or req.user if using JWT auth

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 2️⃣ Fetch user and populate groups
    const user = await UserModel.findById(id)
      .populate({
        path: 'groups.group',
        select: 'name description imageUrl', // Group fields to show
      })
      .select('-password -OTPNumberOfAttempts'); // Hide sensitive fields

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3️⃣ Return profile
    res.status(200).json({
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        gender: user.gender,
        imageUrl: user.imageUrl,
        verified: user.verified,
        groups: user.groups.map(g => ({
          _id: g.group._id,
          name: g.group.name,
          description: g.group.description,
          imageUrl: g.group.imageUrl,
          status: g.status,
          permissions: g.permissions
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const userDashboard = async (req, res) => {
  try {
    return res.status(200).json({message: "It got here"})
  } catch (error) {
    console.error(error);
  }
}

export const adminSearchedUsers = async (req, res) => {
  const { id } = req.params; // groupId
  const {
    fullName,
    email,
    role,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    // Step 1: Get group and its members
    const group = await GroupModel.findById(id).populate({
      path: 'members.user',
      select: '_id',
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberIds = group.members.map(m => m.user?._id).filter(Boolean);

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

    if (role?.trim()) {
      query.role = { $regex: role.trim(), $options: "i" };
    }

    // Step 3: Get total matching count
    const total = await UserModel.countDocuments(query);

    // Step 4: Fetch paginated users
    const users = await UserModel.find(query)
      .select('_id fullName email phoneNumber role')
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

export const adminUsers = async (req, res) => {
  const { id } = req.params; // groupId
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const group = await GroupModel.findById(id)
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