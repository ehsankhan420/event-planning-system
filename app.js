import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Import routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import { checkReminders } from './utils/reminderService.js';
import { connectDB } from './utils/db.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => console.log('Connected to MongoDB from app.js'))
    .catch(err => console.error('MongoDB connection error from app.js:', err));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Schedule reminder checks every minute (only in non-test environment)
let reminderTask;
if (process.env.NODE_ENV !== 'test') {
  reminderTask = cron.schedule('* * * * *', async () => {
    try {
      await checkReminders();
      console.log('Reminder check completed');
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  });
}

// Export the reminderTask for cleanup in tests
export { reminderTask };

// Start server
// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
