import MinutesModel from "../models/minutesModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const createMinutes = async (req, res) => {
    const { title, body, category, tags, author, published } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your minutes must have a title and body content to continue.' });
    }

    try {
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Attempt to create a new minutes
        const newMinutes = await MinutesModel.create({ title, author, body, category, published, tags, thumbnail: req.file ? req.file.location : null, });

        if (!newMinutes) {
            return res.status(500).json({ message: 'Something went wrong while posting minutes. Please try again later.' });
        }

        if (!published) {
            return res.status(201).json({ message: `Minutes created successfully!` });
        }

        // Fetch all users
        const users = await UserModel.find({}, 'email firstname lastname role');

        if (!users || users.length === 0) {
            return res.status(500).json({ message: 'No users found to send emails.' });
        }

        // Extract emails
        const recipientEmails = users.map(user => user.email).join(',');

        // Prepare email sender details (assuming `userExists` is the sender)
        const sender = userExists;

        const mailOptions = {
            to: recipientEmails, // Send to all users
            from: `minutes@selectedfewclub.com`,
            subject: `Meeting minutes for Selected Few Club`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of the minutes.</p>
            <p></p>
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
            res.status(201).json({ message: `Minutes created successfully! Emails sent to all users.` });
        });

    } catch (error) {
        // Log error details for debugging
        console.error('Error creating minutes:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch minutes archive
const fetchMinutesArchive = async (req, res) => {

    try {
        const minutesArchive = await MinutesModel.find()
            .populate('author', 'firstname lastname');
        if (!minutesArchive) {
            return res.status(404).json({ message: 'No minutes archive found.' })
        }
        res.status(200).json(minutesArchive);
    } catch (error) {
        console.error('Error creating minutes:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//edit minutes
const editMinutes = async (req, res) => {
    const { author, minutesId, title, body, published, thumbnail } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your minutes must have a title and body content to continue.' });
    }
    try {

        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the minutes exists first
        const minutes = await MinutesModel.findById(minutesId);
        if (!minutes) {
            return res.status(404).json({ message: 'Minutes not found.' });
        }

        // Update the minutes
        await MinutesModel.findByIdAndUpdate(minutesId, {
            title,
            body,
            published,
            updatedAt: Date.now(),
            thumbnail: req.file ? req.file.location : thumbnail ? thumbnail : null,
        }, { new: true });

        if (!minutes.published) {
            return res.status(200).json({ message: 'Minutes updated successfully!' });
        }

        // Fetch all users
        const users = await UserModel.find({}, 'email firstname lastname role');

        if (!users || users.length === 0) {
            return res.status(500).json({ message: 'No users found to send emails.' });
        }

        // Extract emails
        const recipientEmails = users.map(user => user.email).join(',');

        // Prepare email sender details (assuming `userExists` is the sender)
        const sender = userExists;

        const mailOptions = {
            to: recipientEmails, // Send to all users
            from: `minutes@selectedfewclub.com`,
            subject: `Meeting minutes for Selected Few Club`,
            html: `<p>Hi,</p>
                <p>Please check your Selected Few Club app to see the details of this updated minutes.</p>
                <p></p>
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
            res.status(200).json({ message: `Minutes updated successfully! Emails sent to all users.` });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error updating minutes: ${error.message}` });
    }
};

//delete minutes
const deleteMinutes = async (req, res) => {
    const { minutes } = req.body;

    try {
        const deletedMinutes = await MinutesModel.findByIdAndDelete(minutes);
        if (!deletedMinutes) {
            return res.status(404).json({ message: 'Minutes not found.' });
        }
        res.status(200).json({ message: 'Minutes deleted successfully.' });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' })
    }
}

const deleteMinutesArchive = async (req, res) => {
    const { minutesArchive } = req.body;  // Array of minutes IDs to delete
    try {
        // Ensure the minutes archive is an array and contains valid ObjectIds
        if (!Array.isArray(minutesArchive) || minutesArchive.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of minutes IDs to delete.' });
        }

        // Use deleteMany to delete minutes archive by their IDs
        const deletedMinutesArchive = await MinutesModel.deleteMany({ _id: { $in: minutesArchive } });

        if (deletedMinutesArchive.deletedCount === 0) {
            return res.status(404).json({ message: 'No minutes records found to delete.' });
        }

        res.status(200).json({ message: `${deletedMinutesArchive.deletedCount} minutes records deleted successfully.` });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' });
    }
};


export { createMinutes, fetchMinutesArchive, editMinutes, deleteMinutes, deleteMinutesArchive };