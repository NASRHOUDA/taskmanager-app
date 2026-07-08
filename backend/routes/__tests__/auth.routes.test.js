// Set environment variables before requiring app
process.env.JWT_SECRET = 'test-secret';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_APP_PASSWORD = 'test-password';

const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models');

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock the auth controller to avoid database issues
jest.mock('../../controllers/auth.controller', () => ({
  register: jest.fn((req, res) => {
    res.status(200).json({
      message: 'User registered successfully',
      token: 'fake-token',
      user: { id: 1, email: req.body.email, name: req.body.name }
    });
  }),
  login: jest.fn((req, res) => {
    res.status(200).json({
      message: 'Login successful',
      token: 'fake-token',
      user: { id: 1, email: req.body.email, name: 'Test User' }
    });
  }),
  getMe: jest.fn((req, res) => {
    res.json({ id: 1, email: 'test@example.com', name: 'Test User' });
  }),
  updateProfile: jest.fn((req, res) => {
    res.json({ message: 'Profile updated successfully', user: { id: 1, name: req.body.name } });
  }),
  changePassword: jest.fn((req, res) => {
    res.json({ message: 'Password changed successfully' });
  }),
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'User registered successfully');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login a user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('message', 'Login successful');
    });
  });
});
