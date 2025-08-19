import ConstitutionModel from "../models/constitutionModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const createConstitution = async (req, res) => {
    const { title, body, author, published } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your constitution must have a title and body content to continue.' });
    }

    try {
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Attempt to create a new constitution
        const newConstition = await ConstitutionModel.create({ title, author, body, published, thumbnail: req.file ? req.file.location : null, });

        if (!newConstition) {
            return res.status(500).json({ message: 'Something went wrong while posting constitution. Please try again later.' });
        }

        if (!published) {
            return res.status(201).json({ message: `Constitution created successfully!` });
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
            from: `constitution@selectedfewclub.com`,
            subject: `Constitution for Selected Few Club`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of the constitution.</p>
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
            res.status(201).json({ message: `Constitution created successfully! Emails sent to all users.` });
        });

    } catch (error) {
        // Log error details for debugging
        console.error('Error creating constitution:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch constition
const fetchConstitution = async (req, res) => {
    try {
        const constitution = await ConstitutionModel.findOne()
            .sort({ createdAt: -1 })
            .populate('author', 'firstname lastname');
        if (!constitution) {
            return res.status(404).json({ message: 'No constitution found.' })
        }
        res.status(200).json(constitution);
    } catch (error) {
        console.error('Error fetching constitution:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//fetch constitutions
const fetchConstitutions = async (req, res) => {

    try {
        const constitutions = await AnnouncementModel.find()
            .populate('author', 'firstname lastname');
        if (!constitutions) {
            return res.status(404).json({ message: 'No constitutions found.' })
        }
        res.status(200).json(constitutions);
    } catch (error) {
        console.error('Error fetching constitutions:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//edit constitution
const editConstitution = async (req, res) => {
    const { constitutionId, title, body, author, published } = req.body;

    // Input validation
    if (!constitutionId || !title || !body) {
        return res.status(400).json({ message: 'Your constitution must have a title and body content to continue.' });
    }
    try {
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Check if the constitution exists first
        const constitution = await ConstitutionModel.findById(constitutionId);
        if (!constitution) {
            return res.status(404).json({ message: 'Constitution not found.' });
        }

        // Update the constitution
        await ConstitutionModel.findByIdAndUpdate(constitutionId, {
            title,
            body,
            published,
            updatedAt: Date.now(),
            
        }, { new: true });

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
            from: `constitution@selectedfewclub.com`,
            subject: `Constitution for Selected Few Club`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of the constitution.</p>
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
            res.status(200).json({ message: `Constitution ammended successfully! Emails sent to all users.` });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error updating constitution: ${error.message}` });
    }
};

//delete constitution
const deleteConstitution = async (req, res) => {
    const {constitution} = req.body;

    try {
        const deletedConstitution = await ConstitutionModel.findByIdAndDelete(constitution);
        if (!deletedConstitution) {
            return res.status(404).json({ message: 'Constitution not found.' });
        }
        res.status(200).json({ message: 'Constitution deleted successfully.' });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' })
    }
}



export { createConstitution, editConstitution, fetchConstitution, fetchConstitutions }