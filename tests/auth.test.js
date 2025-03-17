import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { expect, beforeAll, beforeEach, afterAll, describe, it, jest } from '@jest/globals';
import app, { reminderTask } from '../app.js';
// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// Connect to test database before tests
// Connect to test database before tests
// Connect to test database before tests
beforeAll(async () => {
    const testDbUri = process.env.TEST_MONGODB_URI ||  'mongodb+srv://rockstarabhi53060:callofDUTY@cluster0.fpe9s.mongodb.net/';
    await mongoose.connect(testDbUri, {
      serverSelectionTimeoutMS: 30000, // Increase timeout for server selection
      socketTimeoutMS: 30000, // Increase socket timeout
    });
    
    // Ensure connection is established
    console.log('MongoDB connection state:', mongoose.connection.readyState);
  }, 30000);
  
  // Clear database between tests
  beforeEach(async () => {
    try {
      await User.deleteMany({});
    } catch (error) {
      console.error('Error clearing users:', error);
    }
  }, 15000); // Increase timeout for beforeEach

// Disconnect after tests
// Disconnect after tests
// At the end of the file, in the afterAll hook:
afterAll(async () => {
    // Stop the cron job if it exists
    if (reminderTask) {
      reminderTask.stop();
    }
    
    await mongoose.connection.close();
    // Add a small delay to ensure all connections are properly closed
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 10000);

  
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toEqual(testUser.username);
      expect(res.body.user.email).toEqual(testUser.email);
    });
    
    it('should not register a user with existing email', async () => {
      // Create a user first
      await new User(testUser).save();
      
      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
    });
    
    it('should not login with invalid credentials', async () => {
      // Create a user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Try to login with wrong password
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});