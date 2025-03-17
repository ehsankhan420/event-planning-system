import Event from '../models/Event.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

// Function to check for pending reminders
export const checkReminders = async () => {
  const now = new Date();
  
  // Find reminders that are due but not sent yet
  const events = await Event.find({
    'reminders.time': { $lte: now },
    'reminders.sent': false
  }).populate('user', 'email username');
  
  // Process each event
  for (const event of events) {
    const user = await User.findById(event.user);
    
    // Process each reminder
    for (let i = 0; i < event.reminders.length; i++) {
      const reminder = event.reminders[i];
      
      // Check if reminder is due and not sent
      if (reminder.time <= now && !reminder.sent) {
        // Send notification (email in this case)
        try {
          await sendReminderEmail(user.email, user.username, event);
          
          // Mark reminder as sent
          event.reminders[i].sent = true;
          await event.save();
          
          console.log(`Reminder sent for event: ${event.name} to user: ${user.username}`);
        } catch (error) {
          console.error(`Failed to send reminder for event: ${event.name}`, error);
        }
      }
    }
  }
};

// Function to send reminder email
const sendReminderEmail = async (email, username, event) => {
  const eventDate = new Date(event.date).toLocaleString();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@eventplanner.com',
    to: email,
    subject: `Reminder: ${event.name}`,
    html: `
      <h1>Event Reminder</h1>
      <p>Hello ${username},</p>
      <p>This is a reminder for your upcoming event:</p>
      <h2>${event.name}</h2>
      <p><strong>Date:</strong> ${eventDate}</p>
      <p><strong>Category:</strong> ${event.category}</p>
      <p><strong>Description:</strong> ${event.description || 'No description provided'}</p>
      <p>Thank you for using our Event Planning System!</p>
    `
  };
  
  return transporter.sendMail(mailOptions);
};