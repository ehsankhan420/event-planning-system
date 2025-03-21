import request from 'supertest';
import User from '../models/User.js';
import Event from '../models/Event.js';
import jwt from 'jsonwebtoken';
import { expect, beforeAll, beforeEach, afterAll, describe, it } from '@jest/globals';
import app, { reminderTask } from '../app.js';
import { connectDB, disconnectDB } from '../utils/db.js';

// Test user data
const testUser = {
  username: 'eventuser',
  email: 'events@example.com',
  password: 'password123'
};

// Test event data
const testEvent = {
  name: 'Test Event',
  description: 'This is a test event',
  date: new Date('2023-12-31T12:00:00Z'),
  category: 'Meeting',
  reminders: [{ time: new Date('2023-12-30T12:00:00Z'), sent: false }]
};

let token;
let userId;

// Connect to test database before tests
beforeAll(async () => {
  // Connect to the test database
  await connectDB();
  
  // Create a test user
  const user = new User(testUser);
  await user.save();
  userId = user._id;
  
  // Generate token
  token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1d' }
  );
  
  console.log('Events tests: Connected to MongoDB and created test user');
}, 30000);

// Clear events between tests
beforeEach(async () => {
  await Event.deleteMany({});
  console.log('Events tests: Cleared events collection');
});

// Disconnect after tests
afterAll(async () => {
  await User.deleteMany({});
  await Event.deleteMany({});
  
  if (reminderTask) {
    reminderTask.stop();
  }
  
  // Disconnect from MongoDB
  await disconnectDB();
  
  // Add a small delay to ensure all connections are properly closed
  await new Promise(resolve => setTimeout(resolve, 1000));
}, 30000); // Increased timeout to 30 seconds

describe('Events API', () => {
  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send(testEvent);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toEqual(testEvent.name);
      expect(res.body.user.toString()).toEqual(userId.toString());
    });
    
    it('should not create event without authentication', async () => {
      const res = await request(app)
        .post('/api/events')
        .send(testEvent);
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  describe('GET /api/events', () => {
    it('should get all events for a user', async () => {
      // Create a test event
      const event = new Event({
        ...testEvent,
        user: userId
      });
      await event.save();
      
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1);
      expect(res.body[0].name).toEqual(testEvent.name);
    });
    
    it('should filter events by category', async () => {
      // Create two events with different categories
      const event1 = new Event({
        ...testEvent,
        user: userId
      });
      await event1.save();
      
      const event2 = new Event({
        ...testEvent,
        name: 'Birthday Event',
        category: 'Birthday',
        user: userId
      });
      await event2.save();
      
      const res = await request(app)
        .get('/api/events?category=Birthday')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(1);
      expect(res.body[0].category).toEqual('Birthday');
    });
  });
  
  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      // Create a test event
      const event = new Event({
        ...testEvent,
        user: userId
      });
      await event.save();
      
      const updatedData = {
        ...testEvent,
        name: 'Updated Event Name'
      };
      
      const res = await request(app)
        .put(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updatedData.name);
    });
  });
  
  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      // Create a test event
      const event = new Event({
        ...testEvent,
        user: userId
      });
      await event.save();
      
      const res = await request(app)
        .delete(`/api/events/${event._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      
      // Verify event is deleted
      const deletedEvent = await Event.findById(event._id);
      expect(deletedEvent).toBeNull();
    });
  });
});
