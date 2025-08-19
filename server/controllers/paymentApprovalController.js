import mongoose from "mongoose";
import PaymentApprovalModel from "../models/paymentApprovalModel.js";
import TransactionModel from "../models/transactionModel.js";
import UserModel from "../models/userModel.js";
import nodemailer from 'nodemailer';
import AdminTransactionModel from "../models/adminTransactionModel.js";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

//request payment approval
const clubTransferRequest = async (req, res) => {
    const { initiatedBy, amount, description } = req.body;

    if (!initiatedBy || !amount || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const user = await UserModel.findById(initiatedBy);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const sendRequest = await AdminTransactionModel.create({ initiatedBy, amount: Number(amount), description });
        if (!sendRequest) {
            return res.status(404).json({ message: 'Something went wrong while sending your request. Please try again later.' });
        }

        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        const chairman = await UserModel.findOne({ role: 'chairman' });
        if (!chairman) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const mailOptions = {
            to: chairman.email,
            from: `${user.firstname}@selectedfewclub.com`,
            subject: `Club transfer approval request from ${user.firstname + " " + user.lastname}`,
            html: `<p>${user.firstname + " " + user.lastname} is requesting <strong>${formattedAmount}</strong> transfer approval request for the following:</p>
            <p>${description}</P>
            <p>Thank you,</p>
            <p>${user.firstname + " " + user.lastname},</p>
            <p>${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            console.log('Email sent: ', info?.accepted || 'No status available');
            res.status(201).json({ message: `Successfully requested for ${formattedAmount} payment approval to ${user.firstname}.` });
        });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong while sending your request. Try again later.' });
        console.error(error);
    }
}

//request payment approval
const requestPaymentApproval = async (req, res) => {
    const { sender, amount, description } = req.body;

    if (!sender || !amount || !description) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const user = await UserModel.findById(sender);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const sendRequest = await PaymentApprovalModel.create({ sender, amount, description });
        if (!sendRequest) {
            return res.status(404).json({ message: 'Something went wrong while sending your request. Please try again later.' });
        }

        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        const treasurer = await UserModel.findOne({ role: 'treasurer' });
        if (!treasurer) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const mailOptions = {
            to: treasurer.email,
            from: `${user.firstname}@selectedfewclub.com`,
            subject: `Fund transfer approval from ${user.firstname + " " + user.lastname}`,
            html: `<p>${user.firstname + " " + user.lastname} transferred <strong>${formattedAmount}</strong> to Selected Few Club account.</p>
            <p>${description}</P>
            <p>Thank you,</p>
            <p>${user.firstname + " " + user.lastname},</p>
            <p>${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            console.log('Email sent: ', info?.accepted || 'No status available');
            res.status(201).json({ message: `Successfully requested for ${formattedAmount} payment approval to ${treasurer.firstname}.` });
        });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong while sending your request. Try again later.' });
        console.error(error);
    }
}

//fetch payment approvals
const fetchPendingPaymentApproval = async (req, res) => {
    try {
        const paymentApprovals = await PaymentApprovalModel.find({ approved: false })
            .populate('sender', 'firstname lastname')

        if (!paymentApprovals || paymentApprovals.length === 0) {
            return res.status(404).json({ message: 'No pending payment approvals found.' });
        }

        res.status(200).json(paymentApprovals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching payment approval requests. Try again later.' });
    }
};

//fetch club fund transfers
const adminFetchFundTransfers = async (req, res) => {
    try {
        const fundTransferApprovals = await AdminTransactionModel.find()
            .populate('initiatedBy', 'firstname lastname')
            .populate('approvedBy', 'firstname lastname');

        if (!fundTransferApprovals || fundTransferApprovals.length === 0) {
            return res.status(404).json({ message: 'No fund transfer approvals found.' });
        }

        res.status(200).json(fundTransferApprovals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching fund transfer approval requests. Try again later.' });
    }
};


const fetchPaymentApprovals = async (req, res) => {
    try {
        const paymentApprovals = await PaymentApprovalModel.find()
            .populate('sender', 'firstname lastname');

        if (!paymentApprovals || paymentApprovals.length === 0) {
            return res.status(404).json({ message: 'No payment approvals found.' });
        }

        res.status(200).json(paymentApprovals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching payment approval requests. Try again later.' });
    }
};

//fetch user payment approvals
const fetchUserPaymentApprovals = async (req, res) => {
    const {id} = req.query;
    try {
        const paymentApprovals = await PaymentApprovalModel.find({$or: [{sender: id}, {receiver: id}]})
            .populate('sender', 'firstname lastname');
        if (!paymentApprovals || paymentApprovals.length === 0) {
            return res.status(404).json({ message: 'No payment approvals found.' });
        }

        res.status(200).json(paymentApprovals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Something went wrong while fetching payment approval requests. Try again later.' });
    }
};

//approve admin fund transfer request
const approveClubTransfer = async (req, res) => {
    const { description, amount, comment, approvedBy, initiatedBy, transactionId } = req.body;

    if (!description || !amount || !approvedBy || !initiatedBy || !transactionId) {
        return res.status(400).json({ message: 'All fields are required' }); // Use 400 for bad request
    }

    const session = await mongoose.startSession(); // Start session

    try {
        session.startTransaction();

        const receiver = await UserModel.findOne({ accountNumber: '1001' }).session(session);
        if (!receiver) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: `User with the provided account number does not exist.` });
        }

        receiver.accountBalance -= Number(amount);
        await receiver.save({ session });

        // Update payment approval
        const approveRequest = await AdminTransactionModel.findByIdAndUpdate(transactionId,
            { approved: true, sent: true, approvedBy, comment, approvedAt: Date.now() },
            { new: true, session } // Ensure session is used
        );
        if (!approveRequest) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ message: 'Something went wrong while processing your request. Please try again later.' });
        }

        const user = await UserModel.findById(approvedBy).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Please re-login to try again.' });
        }

        const requestedBy = await UserModel.findById(initiatedBy).session(session);
        if (!requestedBy) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Treasurer not found. Re-login to try again.' });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Format amount
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        // Prepare email
        const mailOptions = {
            to: requestedBy.email,
            from: `${user.firstname}@selectedfewclub.com`,
            subject: `Fund transfer approval from ${user.firstname + " " + user.lastname}`,
            html: `<p>Hi ${requestedBy.firstname},</p>
            <p>Your <strong>${formattedAmount}</strong> transfer from Selected Few Club account with the following description has been approved:</p>
            <p>${approveRequest.description}</P>
            <p>Thank you,</p>
            <p>${user.firstname + " " + user.lastname},</p>
            <p>${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        };

        // Send email (ensure it's awaited)
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: `Successfully approved ${formattedAmount} fund transfer request from ${requestedBy.firstname + " " + requestedBy.lastname}.` });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong while processing your request. Try again later.' });
    }
};

//approve fund transfer
const approveFundTransfer = async (req, res) => {
    const { description, amount, comment, senderId, paymentId, treasurerId } = req.body;

    if (!description || !amount || !senderId || !paymentId || !treasurerId) {
        return res.status(400).json({ message: 'All fields are required' }); // Use 400 for bad request
    }

    const session = await mongoose.startSession(); // Start session

    try {
        session.startTransaction();

        const receiver = await UserModel.findOne({ accountNumber: '1001' }).session(session);
        if (!receiver) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: `User with the provided account number does not exist.` });
        }

        receiver.accountBalance += Number(amount);
        await receiver.save({ session });

        // Create transaction record with session
        const transaction = new TransactionModel({ sender: senderId, receiver: receiver._id, description, amount });
        await transaction.save({ session });

        // Update payment approval
        const approveRequest = await PaymentApprovalModel.findByIdAndUpdate(paymentId,
            { approved: true, approvedBy: treasurerId, approvedAt: Date.now() },
            { new: true, session } // Ensure session is used
        );
        if (!approveRequest) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ message: 'Something went wrong while processing your request. Please try again later.' });
        }

        const sender = await UserModel.findById(senderId).session(session);
        if (!sender) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Sender not found. Re-login to try again.' });
        }

        const treasurer = await UserModel.findById(treasurerId).session(session);
        if (!treasurer) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Treasurer not found. Re-login to try again.' });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Format amount
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        // Prepare email
        const mailOptions = {
            to: sender.email,
            from: `${treasurer.firstname}@selectedfewclub.com`,
            subject: `Fund transfer approval from ${treasurer.firstname + " " + treasurer.lastname}`,
            html: `<p>Hi ${sender.firstname},</p>
            <p>Your <strong>${formattedAmount}</strong> transfer to Selected Few Club account with the following description has been approved:</p>
            <p>${description}</P>
            <p>${comment}</p>
            <p>Thank you,</p>
            <p>${treasurer.firstname + " " + treasurer.lastname},</p>
            <p>${treasurer.role.charAt(0).toUpperCase() + treasurer.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        };

        // Send email (ensure it's awaited)
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: `Successfully approved ${formattedAmount} fund transfer from ${sender.firstname + " " + sender.lastname}.` });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        return res.status(500).json({ message: 'Something went wrong while processing your request. Try again later.' });
    }
};

//reject admin transfer request
const rejectClubTransfer = async (req, res) => {
    const { description, amount, comment, approvedBy, initiatedBy, transactionId } = req.body;
    
    if (!description || !amount || !approvedBy || !initiatedBy || !transactionId) {
        return res.status(404).json({ message: 'All fields are required.' })
    }

    try {
        const rejectRequest = await AdminTransactionModel.findByIdAndDelete(transactionId);
        if (!rejectRequest) {
            return res.status(404).json({ message: 'Something went wrong while processing this request. Please try again later.' });
        }

        const user = await UserModel.findById(approvedBy);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const requestedBy = await UserModel.findById(initiatedBy);
        if (!requestedBy) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        const mailOptions = {
            to: requestedBy.email,
            from: `${user.firstname}@selectedfewclub.com`,
            subject: `Fund transfer rejection from Selected Few Club`,
            html: `<p>Hi ${requestedBy.firstname},</p>
            <p>Your <strong>${formattedAmount}</strong> transfer request from Selected Few Club account  was rejected due to the following reason:</p>
            <p>${comment}</p>
            <p>Thank you,</p>
            <p>${user.firstname + " " + user.lastname},</p>
            <p>${user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            console.log('Email sent: ', info?.accepted || 'No status available');
            res.status(200).json({ message: `Successfully rejected ${formattedAmount} fund transfer from ${requestedBy.firstname + " " + requestedBy.lastname}.` });
        });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong while processing your request. Try again later.' });
        console.error(error);
    }
}


//reject payment
const rejectPayment = async (req, res) => {
    const { description, amount, comment, senderId, paymentId, treasurerId } = req.body;

    if (!description || !amount || !senderId || !paymentId || !treasurerId) {
        return res.status(404).json({ message: 'All fields are required.' })
    }

    try {
        const rejectRequest = await PaymentApprovalModel.findByIdAndDelete(paymentId);
        if (!rejectRequest) {
            return res.status(404).json({ message: 'Something went wrong while processing this request. Please try again later.' });
        }

        const sender = await UserModel.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const treasurer = await UserModel.findById(treasurerId);
        if (!treasurer) {
            return res.status(404).json({ message: 'User not found. Re-login to try again.' });
        }

        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(amount);

        const mailOptions = {
            to: sender.email,
            from: `${treasurer.firstname}@selectedfewclub.com`,
            subject: `Fund transfer rejection from Selected Few Club`,
            html: `<p>Hi ${sender.firstname},</p>
            <p>Your <strong>${formattedAmount}</strong> transfer to Selected Few Club account with the following description was rejected:</p>
            <p>${description}</P>
            <p>${comment}</p>
            <p>Thank you,</p>
            <p>${treasurer.firstname + " " + treasurer.lastname},</p>
            <p>${treasurer.role.charAt(0).toUpperCase() + treasurer.role.slice(1).toLowerCase()}</p>
            <p>Selected Few Club.</p>`
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            console.log('Email sent: ', info?.accepted || 'No status available');
            res.status(200).json({ message: `Successfully rejected ${formattedAmount} fund transfer from ${sender.firstname + " " + sender.lastname}.` });
        });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong while processing your request. Try again later.' });
        console.error(error);
    }
}

export { adminFetchFundTransfers, clubTransferRequest, approveClubTransfer, rejectClubTransfer, requestPaymentApproval, approveFundTransfer, rejectPayment, fetchPaymentApprovals, fetchUserPaymentApprovals, fetchPendingPaymentApproval };