import mongoose from 'mongoose';

// Track connection state
let isConnected = false;

export async function connectDB() {
  // If already connected, return the existing connection
  if (isConnected) {
    return mongoose.connection;
  }

  // Determine which connection string to use
  const uri = process.env.NODE_ENV === 'test'
    ? (process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/event-planner-test')
    : (process.env.MONGODB_URI || 'mongodb://localhost:27017/event-planner');

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    
    isConnected = true;
    console.log('Connected to MongoDB:', uri);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}

// For testing purposes
export function getConnectionState() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState
  };
}
