import PaymentModel from "../models/paymentModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const createPayment = async (req, res) => {
    const { title, description, amount, dueDate, users, createdBy } = req.body;

    if (!title || !description || !amount || !dueDate || !users || !createdBy) {
        return res.status(400).json({ message: 'All fields are required to continue.' });
    }

    try {
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of user IDs.' });
        }

        const userExists = await UserModel.findById(createdBy);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Assign users with default payment status (paid: false)
        const userPayments = users.map(userId => ({ userId, paid: false }));

        // Create new payment record
        const newPayment = await PaymentModel.create({ title, description, amount, dueDate, users: userPayments, createdBy });

        if (!newPayment) {
            return res.status(400).json({ message: 'Something went wrong while adding payment.' });
        }

        // Fetch all users
        const allUsers = await UserModel.find({}, 'email firstname lastname role');

        if (!allUsers || allUsers.length === 0) {
            return res.status(500).json({ message: 'No users found to send emails.' });
        }

        // Extract emails
        const recipientEmails = allUsers.map(user => user.email).join(',');

        // Prepare email sender details (assuming `userExists` is the sender)
        const sender = userExists;

        const mailOptions = {
            to: recipientEmails, // Send to all users
            from: `payment@selectedfewclub.com`,
            subject: `New Payment for Selected Few Club`,
            html: `<p>Hi,</p>
                    <p>Please check your Selected Few Club app to see the details of the payment.</p>
                    <p>Please endeavor to pay on time.</p>
                    <p>Thank you,</p>
                    <p>${sender.firstname} ${sender.lastname},</p>
                    <p>${sender.role.charAt(0).toUpperCase() + sender.role.slice(1).toLowerCase()}</p>
                    <p>Selected Few Club.</p>`
        };

        // Send email
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            console.log('Email sent: ', info?.accepted || 'No status available');
            res.status(201).json({ message: `Payment created successfully! Emails sent to all users.` });
        });


    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
};


//fetch payments
const fetchPayments = async (req, res) => {
    try {
        const payments = await PaymentModel.find()
            .populate('createdBy', 'firstname lastname');
        if (!payments) {
            return res.status(404).json({ message: 'No payments found.' })
        }
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch user payments
// const fetchUserPayments = async (req, res) => {
//     const {id} = req.params;
//     try {
//         const payments = await PaymentModel.find({'users.userId': id})
//         .populate('createdBy', 'firstname lastname')
//         .populate('users', 'paid');
//         if (!payments) {
//             return res.status(404).json({ message: 'No payments found.' });
//         }
//         res.status(200).json(payments);
//     } catch (error) {
//         console.error('Error fetching payments:', error);
//         res.status(500).json({ message: `Internal Server Error: ${error.message}` });
//     }
// }

const fetchUserPayments = async (req, res) => {
    const { id } = req.params;
    try {
        const payments = await PaymentModel.find({ 'users.userId': id })
            .populate('createdBy', 'firstname lastname')
            .populate('users.userId', 'firstname lastname'); // Ensure userId is populated fully

        if (!payments) {
            return res.status(404).json({ message: 'No payments found.' });
        }
        res.status(200).json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
};


//make payment
const makePayment = async (req, res) => {
    try {
        const { paymentId, userId } = req.body; // Ensure the frontend sends these directly

        // Find Payment
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        // Find User
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check sufficient balance
        const accountBalance = user.accountBalance;
        if (payment.amount > accountBalance) {
            return res.status(403).json({
                message: "You don't have sufficient balance to make this payment. Please fund your account."
            });
        }

        // Deduct balance & update user
        user.accountBalance = (accountBalance - payment.amount).toFixed(2);
        await user.save();

        // Update payment status for the user
        const updatedPayment = await PaymentModel.findOneAndUpdate(
            { _id: paymentId, "users.userId": userId }, // Find the payment and user
            { $set: { "users.$.paid": true } }, // Update only this user's payment status
            { new: true }
        );

        if (!updatedPayment) {
            return res.status(400).json({ message: 'User payment status not updated.' });
        }

        res.status(200).json({ message: 'Payment successful.', payment: updatedPayment });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
};


// const getPaymentStatus = async (req, res) => {
//     const { paymentId } = req.params;

//     try {
//         const payment = await PaymentModel.findById(paymentId).populate('users.userId', 'firstname lastname email');

//         if (!payment) {
//             return res.status(404).json({ message: 'Payment not found.' });
//         }

//         const paidUsers = payment.users.filter(user => user.paid);
//         const unpaidUsers = payment.users.filter(user => !user.paid);

//         res.status(200).json({ paidUsers, unpaidUsers });

//     } catch (error) {
//         console.error('Error fetching payment status:', error);
//         res.status(500).json({ message: `Internal Server Error: ${error.message}` });
//     }
// };

// delete payment

const deletePayment = async (req, res) => {
    const { id } = req.params;
    console.log(id)
    try {
        const deletedPayment = await PaymentModel.findByIdAndDelete(id);
        if (!deletedPayment) {
            return res.status(404).json({ message: 'something went wrong while deleting this payment.' });
        }

        res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong while deleting the payment. Try again later.' });
        console.error(error);
    }
}

//delete payments
const deletePayments = async (req, res) => {
    const { payments } = req.body;  // Array of payment IDs to delete
    try {
        // Ensure the payments is an array and contains valid ObjectIds
        if (!Array.isArray(payments) || payments.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of payment IDs to delete.' });
        }

        // Use deleteMany to delete payments by their IDs
        const deletedPayments = await PaymentModel.deleteMany({ _id: { $in: payments } });

        if (deletedPayments.deletedCount === 0) {
            return res.status(404).json({ message: 'No payments found to delete.' });
        }

        res.status(200).json({ message: `${deletedPayments.deletedCount} payments deleted successfully.` });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' });
    }
};


export { createPayment, fetchPayments, fetchUserPayments, deletePayment, deletePayments, makePayment };