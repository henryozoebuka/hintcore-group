import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
    // 🧹 Trim string inputs
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
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;
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
    const existingUser = await UserModel.findOne({ email });
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

    // 7️⃣ Create user
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

    // 8️⃣ Prepare group with memberCounter starting at 1
    const abbrev = generateGroupAbbrev(groupName);
    const memberNumber = `${abbrev}-001`;

    const [newGroup] = await GroupModel.create(
      [
        {
          name: groupName,
          description,
          groupPassword: hashedGroupPassword,
          createdBy: newUser._id,
          joinCode,
          memberCounter: 1, // start counting members
          abbreviation: abbrev,
          members: [
            {
              user: newUser._id,
              memberNumber,
              status: "active",
              permissions: ["admin", "manage_members", "manage_announcements", "manage_events"],
            },
          ],
        },
      ],
      { session }
    );

    // 9️⃣ Link group to user
    newUser.groups.push({
      group: newGroup._id,
      status: "active",
      permissions: ["admin", "manage_members", "manage_announcements", "manage_events"],
    });

    newUser.currentGroup = newGroup._id;
    await newUser.save({ session });

    // 🔟 OTP generation & save
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

    // 1️⃣1️⃣ Commit transaction before sending email
    await session.commitTransaction();
    session.endSession();

    // 1️⃣2️⃣ Send OTP email (outside transaction)
    try {
      await transporter.sendMail(getMailOptions(email, formattedOTP));
    } catch (mailErr) {
      console.error("Email sending failed:", mailErr);
    }

    return res.status(201).json({
      message: "Group and account created successfully. Please verify your email with the OTP sent.",
      userId: newUser._id,
      groupId: newGroup._id,
      joinCode,
      memberNumber,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("CreateGroup Error:", error);
    return res.status(500).json({ message: "Internal server error during group creation." });
  }
};

export const createAnotherGroup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      groupName: rawGroupName,
      description: rawDescription = "",
      groupPassword: rawGroupPassword,
    } = req.body;
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID in token" });
    }

    const groupName = typeof rawGroupName === "string" ? rawGroupName.trim() : rawGroupName;
    const description = typeof rawDescription === "string" ? rawDescription.trim() : rawDescription;
    const groupPassword = typeof rawGroupPassword === "string" ? rawGroupPassword.trim() : rawGroupPassword;

    if (!groupName || !groupPassword) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Generate unique join code
    let joinCode;
    do {
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (await GroupModel.findOne({ joinCode }));

    const hashedGroupPassword = await bcrypt.hash(groupPassword, 10);

    const groupOwner = await UserModel.findById(userId).session(session);
    if (!groupOwner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    const abbrev = generateGroupAbbrev(groupName);
    const memberNumber = `${abbrev}-001`;

    const [newGroup] = await GroupModel.create(
      [
        {
          name: groupName,
          description,
          groupPassword: hashedGroupPassword,
          createdBy: groupOwner._id,
          joinCode,
          memberCounter: 1,
          abbreviation: abbrev,
          members: [
            {
              user: groupOwner._id,
              memberNumber,
              status: "active",
              permissions: ["admin", "manage_members", "manage_announcements", "manage_events"],
            },
          ],
        },
      ],
      { session }
    );

    // Link group to user
    groupOwner.groups.push({
      group: newGroup._id,
      status: "active",
      permissions: ["admin", "manage_members", "manage_announcements", "manage_events"],
    });

    groupOwner.currentGroup = newGroup._id;
    await groupOwner.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Get only THIS USER's permissions for the current group
    const groupOwnerData = groupOwner.groups.find(
      gp => gp.group.toString() === newGroup._id.toString()
    );

    const userPermissions = groupOwnerData?.permissions ?? [];

    let token;
    try {
      token = jwt.sign(
        { userId: groupOwner._id, currentGroupId: newGroup._id, permissions: userPermissions },
        process.env.JWT_PASSWORD,
        { expiresIn: '1d' }
      );
    } catch (err) {
      console.error("JWT sign error:", err);
      return res.status(500).json({ message: "Error generating token." });
    }

    return res.status(201).json({
      message: `${newGroup.name} created successfully.`,
      token,
      groupName: newGroup.name,
      currentGroupId: newGroup._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("CreateGroup Error:", error);
    return res.status(500).json({ message: "Internal server error during group creation." });
  }
};

export const changeGroup = async (req, res) => {
  try {
    const id = req.params.id; // group id
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user or group ID" });
    }

    // find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // find group
    const newGroup = await GroupModel.findById(id);
    if (!newGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // check if user is a member
    const isAMember = newGroup.members.find(
      (m) => m.user.toString() === userId
    );

    if (!isAMember) {
      return res.status(403).json({ message: `You are not a member of ${newGroup.name}` });
    }

    if (isAMember.status === "inactive") {
      return res.status(403).json({ message: `You are not an active member of ${newGroup.name}, please contact the group admin.` });
    }

    // update user's current group
    user.currentGroup = newGroup._id;
    await user.save();

    // get user permissions for this group
    const userData = user.groups.find(
      (gp) => gp.group.toString() === newGroup._id.toString()
    );
    
    const userPermissions = userData?.permissions ?? [];

    // generate token
    let token;
    try {
      token = jwt.sign(
        { userId: user._id, currentGroupId: newGroup._id, permissions: userPermissions },
        process.env.JWT_PASSWORD,
        { expiresIn: "1d" }
      );
    } catch (err) {
      console.error("JWT sign error:", err);
      return res.status(500).json({ message: "Error generating token." });
    }

    return res.status(200).json({
      message: `You have successfully changed to ${newGroup.name}.`,
      token,
      groupName: newGroup.name,
      currentGroupId: newGroup._id,
    });
  } catch (error) {
    console.error("Change Group Error:", error);
    return res.status(500).json({ message: "Internal server error while changing group." });
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

const generateGroupAbbrev = (groupName) => {
  if (!groupName || typeof groupName !== "string") return "GRP";

  const words = groupName.trim().split(/\s+/);

  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
  }

  if (words.length === 2) {
    return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
  }

  return words[0].slice(0, 3).toUpperCase();
};

const generateMemberNumber = (group, nextCount) => {
  const abbrev = group.abbreviation || generateGroupAbbrev(group.name);

  // fallback if counter is missing
  const safeCount = typeof nextCount === "number" && nextCount > 0
    ? nextCount
    : (group.members?.length || 0) + 1;

  const paddedNum = String(safeCount).padStart(3, "0");
  return `${abbrev}-${paddedNum}`;
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

    // Atomically increment memberCounter and fetch updated group
    const group = await GroupModel.findOneAndUpdate(
      { joinCode },
      { $inc: { memberCounter: 1 } },
      { new: true, session }
    );

    if (!group) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Group not found. Invalid join code." });
    }

    // check if user already exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      const isMember = group.members.some(
        (member) => member.user.toString() === existingUser._id.toString()
      );

      if (isMember) {
        await session.abortTransaction();
        session.endSession();
        return res.status(202).json({
          message: `You are already a member of ${group.name}. Please login instead.`,
        });
      }

      // Generate unique member number safely
      const memberNumber = generateMemberNumber(group, group.memberCounter);
      if (!memberNumber) {
        throw new Error("Failed to generate member number for existing user.");
      }

      group.members.push({
        user: existingUser._id,
        memberNumber,
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

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: `You have been added to ${group.name}, please login to explore.`,
        userId: existingUser._id,
        groupId: group._id,
        memberNumber,
      });
    }

    // ---- If new user ----
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await UserModel.insertMany([{
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      verified: false,
    }], { session });

    const memberNumber = generateMemberNumber(group, group.memberCounter);
    if (!memberNumber) {
      throw new Error("Failed to generate member number for new user.");
    }

    group.members.push({
      user: newUser._id,
      memberNumber,
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
      message: `You have joined ${group.name} successfully, please verify your email to login.`,
      userId: newUser._id,
      groupId: group._id,
      memberNumber,
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

export const manageRemoveMember = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const id = req.params.id;
    const { currentGroupId } = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(currentGroupId) ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    // Remove user from group.members with $pull
    const group = await GroupModel.findByIdAndUpdate(
      currentGroupId,
      { $pull: { members: { user: id } } },
      { new: true, session }
    );

    if (!group) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Group does not exist" });
    }

    // Remove group reference from user.groups with $pull
    const user = await UserModel.findByIdAndUpdate(
      id,
      { $pull: { groups: { group: currentGroupId } } },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ message: `${user.fullName} successfully removed` });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Remove group member Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during group member removal." });
  }
};

export const manageRemoveMembers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ids } = req.body; // expecting { ids: [userId1, userId2, ...] }
    const { currentGroupId } = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(currentGroupId) ||
      !Array.isArray(ids) ||
      ids.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return res.status(400).json({ message: "Invalid group ID or user IDs" });
    }

    // Remove members from the group
    const group = await GroupModel.findByIdAndUpdate(
      currentGroupId,
      { $pull: { members: { user: { $in: ids } } } },
      { new: true, session }
    );

    if (!group) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Group does not exist" });
    }

    // Remove group reference from users
    const users = await UserModel.updateMany(
      { _id: { $in: ids } },
      { $pull: { groups: { group: currentGroupId } } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `${ids.length} user(s) successfully removed`,
      removedUserIds: ids,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Remove multiple group members Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during group members removal." });
  }
};


// export const correct = async () => {
//   const groups = await GroupModel.find();

// for (const group of groups) {
//   let counter = group.memberCounter || 0;

//   group.members = group.members.map((member, idx) => {
//     if (!member.memberNumber) {
//       counter += 1;
//       member.memberNumber = `${generateGroupAbbrev(group.name)}-${String(counter).padStart(3, "0")}`;
//     }
//     return member;
//   });

//   group.memberCounter = counter;
//   await group.save();
//   console.log("success")
// }

// }