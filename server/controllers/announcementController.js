import AnnouncementModel from "../models/announcementModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const createAnnouncement = async (req, res) => {
    const { title, body, category, tags, author, published } = req.body;
    
    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your announcement must have a title and body content to continue.' });
    }

    try {
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Attempt to create a new announcement
        const newAnnouncement = await AnnouncementModel.create({ title, author, body, category, published });

        if (!newAnnouncement) {
            return res.status(500).json({ message: 'Something went wrong while posting announcement. Please try again later.' });
        }

        if (!published) {
            return res.status(201).json({ message: `Announcement created successfully!` });
        }

        // Fetch all users
        const users = await UserModel.find({}, 'email firstname lastname role');

        if (!users || users.length === 0) {
            return res.status(500).json({ message: 'No users found to send emails.' });
        }

        // Extract emails
        // const recipientEmails = users.map(user => user.email).join(',');

        // Prepare email sender details (assuming `userExists` is the sender)
        // const sender = userExists;

        // const mailOptions = {
        //     to: recipientEmails, // Send to all users
        //     from: `announcements@selectedfewclub.com`,
        //     subject: `Announcement for Selected Few Club Members`,
        //     html: `<p>Hi,</p>
        //     <p>Please check your Selected Few Club app to see the details of this announcement.</p>
        //     <p></p>
        //     <p>Thank you,</p>
        //     <p>${sender.firstname} ${sender.lastname},</p>
        //     <p>${sender.role.charAt(0).toUpperCase() + sender.role.slice(1).toLowerCase()}</p>
        //     <p>Selected Few Club.</p>`
        // };

        // Send email
        // transporter.sendMail(mailOptions, (err, info) => {
        //     if (err) {
        //         return res.status(500).json({ message: err.message });
        //     }
        //     console.log('Email sent: ', info?.accepted || 'No status available');
        //     res.status(201).json({ message: `Announcement created successfully! Emails sent to all users.` });
        // });

    } catch (error) {
        // Log error details for debugging
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch announcements
const fetchAnnouncements = async (req, res) => {

    try {
        const announcements = await AnnouncementModel.find()
            .populate('author', 'firstname lastname');
        if (!announcements) {
            return res.status(404).json({ message: 'No announcements found.' })
        }
        res.status(200).json(announcements);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//edit announcement
const editAnnouncement = async (req, res) => {
    const {  author, announcementId, title, body, published, thumbnail } = req.body;
    
    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your announcement must have a title and body content to continue.' });
    }
    try {

        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the announcement exists first
        const announcement = await AnnouncementModel.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }

        // Update the announcement
        await AnnouncementModel.findByIdAndUpdate(announcementId, {
            title,
            body,
            published,
            updatedAt: Date.now(),
            thumbnail: req.file ? req.file.location : thumbnail ? thumbnail : null,
        }, {new: true});

        // Success response

        if (!announcement.published) {
            return res.status(200).json({ message: 'Announcement updated successfully!' });
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
            from: `announcements@selectedfewclub.com`,
            subject: `Announcement for Selected Few Club Members`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of this updated announcement.</p>
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
            res.status(200).json({ message: `Announcement updated successfully! Emails sent to all users.` });
        });

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error updating announcement: ${error.message}` });
    }
};

//delete user account
const deleteAnnouncement = async (req, res) => {
    const {announcement} = req.body;

    try {
        const deletedAnnouncement = await AnnouncementModel.findByIdAndDelete(announcement);
        if (!deletedAnnouncement) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }
        res.status(200).json({ message: 'Announcement deleted successfully.' });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' })
    }
}

const deleteAnnouncements = async (req, res) => {
    const { announcements } = req.body;  // Array of announcement IDs to delete
    try {
        // Ensure the announcements is an array and contains valid ObjectIds
        if (!Array.isArray(announcements) || announcements.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of announcement IDs to delete.' });
        }

        // Use deleteMany to delete announcements by their IDs
        const deletedAnnouncements = await AnnouncementModel.deleteMany({ _id: { $in: announcements } });

        if (deletedAnnouncements.deletedCount === 0) {
            return res.status(404).json({ message: 'No announcements found to delete.' });
        }

        res.status(200).json({ message: `${deletedAnnouncements.deletedCount} announcements deleted successfully.` });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' });
    }
};


export { createAnnouncement, fetchAnnouncements, editAnnouncement, deleteAnnouncement, deleteAnnouncements };