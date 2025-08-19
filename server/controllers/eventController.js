import EventModel from "../models/eventModel.js";
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

// const createEvent = async (req, res) => {
//     const { title, body, category, tags, author, published } = req.body;

//     // Input validation
//     if (!title || !body) {
//         return res.status(400).json({ message: 'Your event must have a title and body content to continue.' });
//     }

//     try {
//         const userExists = await UserModel.findById(author);
//         if (!userExists) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//         // Attempt to create a new event
//         const newEvent = await EventModel.create({ title, author, body, category, published, tags, thumbnail: req.file ? req.file.location : null, });

//         if (!newEvent) {
//             return res.status(500).json({ message: 'Something went wrong while posting event. Please try again later.' });
//         }

//         const users = await UserModel.find();

//         if (!users) {
//             return res.status(500).json({ message: 'Something went wrong while fetching users. Please try again later.' });
//         }

//         const mailOptions = {
//             to: receiver.email,
//             from: `events@selectedfewclub.com`,
//             subject: `Upcoming event for Selected Few Club Members`,
//             html: `<p>Please check your Selected Few Club app to see the details of this event.</p>
//             <p></p>
//             <p>Thank you,</p>
//             <p>${sender.firstname + " " + sender.lastname },</p>
//             <p>${sender.role},</p>
//             <p>Selected Few Club.</p>`
//         }

//         transporter.sendMail(mailOptions, (err, info) => {
//             if (err) {
//                 return res.status(500).json({ message: err.message });
//             }
//             console.log('Email sent: ', info?.accepted || 'No status available');
//             res.status(201).json({ message: `Event created successfully!` });
//         });
// ;
//     } catch (error) {
//         // Log error details for debugging
//         console.error('Error creating event:', error);
//         res.status(500).json({ message: `Internal Server Error: ${error.message}` });
//     }
// }

//fetch events

const createEvent = async (req, res) => {
    const { title, body, category, tags, author, published } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your event must have a title and body content to continue.' });
    }

    try {
        // Check if author exists
        const userExists = await UserModel.findById(author);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Create new event
        const newEvent = await EventModel.create({
            title, author, body, category, published, tags,
            thumbnail: req.file ? req.file.location : null,
        });

        if (!newEvent) {
            return res.status(500).json({ message: 'Something went wrong while posting event. Please try again later.' });
        }

        if (!published) {
            return res.status(201).json({ message: `Event created successfully!` });
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
            from: `events@selectedfewclub.com`,
            subject: `Upcoming event for Selected Few Club`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of the event.</p>
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
            res.status(201).json({ message: `Event created successfully! Emails sent to all users.` });
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
};

const fetchEvents = async (req, res) => {

    try {
        const events = await EventModel.find()
            .populate('author', 'firstname lastname');
        if (!events) {
            return res.status(404).json({ message: 'No events found.' })
        }
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: `Internal Server Error: ${error.message}` });
    }
}

//edit event
const editEvent = async (req, res) => {
    const { author, eventId, title, body, published, thumbnail } = req.body;

    // Input validation
    if (!title || !body) {
        return res.status(400).json({ message: 'Your event must have a title and body content to continue.' });
    }
    try {

        const userExists = await UserModel.findById(author);
                if (!userExists) {
                    return res.status(404).json({ message: 'User not found.' });
                }
        
        // Check if the event exists first
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Update the event
        await EventModel.findByIdAndUpdate(eventId, {
            title,
            body,
            published,
            updatedAt: Date.now(),
            thumbnail: req.file ? req.file.location : thumbnail ? thumbnail : null,
        }, { new: true });

        if (!event.published) {
            // Success response
            return res.status(200).json({ message: 'Event updated successfully!' });
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
            from: `events@selectedfewclub.com`,
            subject: `Upcoming event for Selected Few Club`,
            html: `<p>Hi,</p>
            <p>Please check your Selected Few Club app to see the details of this updated event.</p>
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
            res.status(200).json({ message: `Event updated successfully! Emails sent to all users.` });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error updating event: ${error.message}` });
    }
};

//delete user account
const deleteEvent = async (req, res) => {
    const { event } = req.body;

    try {
        const deletedEvent = await EventModel.findByIdAndDelete(event);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.status(200).json({ message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' })
    }
}

const deleteEvents = async (req, res) => {
    const { events } = req.body;  // Array of event IDs to delete
    try {
        // Ensure the events is an array and contains valid ObjectIds
        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of event IDs to delete.' });
        }

        // Use deleteMany to delete events by their IDs
        const deletedEvents = await EventModel.deleteMany({ _id: { $in: events } });

        if (deletedEvents.deletedCount === 0) {
            return res.status(404).json({ message: 'No events found to delete.' });
        }

        res.status(200).json({ message: `${deletedEvents.deletedCount} events deleted successfully.` });
    } catch (error) {
        console.error('Error occurred at the backend.', error);
        res.status(500).json({ message: 'Error occurred at the backend.' });
    }
};


export { createEvent, fetchEvents, editEvent, deleteEvent, deleteEvents };