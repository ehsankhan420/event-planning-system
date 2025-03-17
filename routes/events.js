import express from 'express';
import Event from '../models/Event.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new event
// Create a new event
router.post('/', async (req, res) => {
    try {
      const { name, description, date, category, reminders } = req.body;
      
      // Create new event
      const newEvent = new Event({
        name,
        description,
        date: new Date(date),
        category,
        user: req.user.id,
        reminders: reminders?.map(r => {
          // Handle both object and string formats
          if (typeof r === 'string' || r instanceof Date) {
            return {
              time: new Date(r),
              sent: false
            };
          }
          return {
            time: new Date(r.time),
            sent: r.sent || false
          };
        }) || []
      });
      
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
// Get all events for a user
router.get('/', async (req, res) => {
  try {
    const { sort, category, upcoming } = req.query;
    
    // Base query
    let query = { user: req.user.id };
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Filter for upcoming events if requested
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }
    
    // Build sort options
    let sortOption = {};
    if (sort === 'category') {
      sortOption = { category: 1, date: 1 };
    } else if (sort === 'reminder') {
      sortOption = { 'reminders.time': 1, date: 1 };
    } else {
      // Default sort by date
      sortOption = { date: 1 };
    }
    
    const events = await Event.find(query).sort(sortOption);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const { name, description, date, category, reminders } = req.body;
    
    // Find and update event
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        name,
        description,
        date: new Date(date),
        category,
        reminders: reminders?.map(r => ({
          time: new Date(r.time || r),
          sent: r.sent || false
        })) || []
      },
      { new: true }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a reminder to an event
router.post('/:id/reminders', async (req, res) => {
  try {
    const { time } = req.body;
    
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $push: {
          reminders: {
            time: new Date(time),
            sent: false
          }
        }
      },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;