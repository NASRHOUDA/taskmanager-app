// Mock models
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('fake-token'),
  verify: jest.fn()
}));

const { User } = require('../../models');
const { register, login, getMe } = require('../../controllers/auth.controller');

// Helper pour créer res mock
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

// ===== Auth Controller =====
describe('Auth Controller', () => {

  beforeEach(() => jest.clearAllMocks());

  // Register
  describe('register', () => {
    test('should return 400 if email already exists', async () => {
      User.findOne.mockResolvedValue({ id: 1, email: 'test@test.com' });
      const req = { body: { email: 'test@test.com', password: '123', name: 'Test' } };
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });

    test('should register user and return token', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 1, email: 'test@test.com', name: 'Test' });
      const req = { body: { email: 'test@test.com', password: '123', name: 'Test' } };
      const res = mockRes();

      await register(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User registered successfully',
        token: 'fake-token'
      }));
    });

    test('should return 500 on error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      const req = { body: { email: 'test@test.com', password: '123', name: 'Test' } };
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // Login
  describe('login', () => {
    test('should return 401 if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const req = { body: { email: 'test@test.com', password: '123' } };
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    test('should return 401 if password invalid', async () => {
      User.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        validatePassword: jest.fn().mockResolvedValue(false)
      });
      const req = { body: { email: 'test@test.com', password: 'wrong' } };
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return token if credentials valid', async () => {
      User.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        name: 'Test',
        validatePassword: jest.fn().mockResolvedValue(true)
      });
      const req = { body: { email: 'test@test.com', password: '123' } };
      const res = mockRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'fake-token'
      }));
    });

    test('should return 500 on error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      const req = { body: { email: 'test@test.com', password: '123' } };
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // getMe
  describe('getMe', () => {
    test('should return user without password', async () => {
      const req = {
        user: {
          toJSON: jest.fn().mockReturnValue({ id: 1, email: 'test@test.com', password: 'hashed' })
        }
      };
      const res = mockRes();

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: 1, email: 'test@test.com' });
    });

    test('should return 500 on error', async () => {
      const req = { user: { toJSON: jest.fn().mockImplementation(() => { throw new Error('error'); }) } };
      const res = mockRes();

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
