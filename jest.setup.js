// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Import jest from @jest/globals
import { jest } from '@jest/globals';

// Increase timeout for all tests
jest.setTimeout(30000);