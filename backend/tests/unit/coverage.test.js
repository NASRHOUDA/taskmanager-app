const errorMiddleware = require('../../middleware/error.middleware');
const logger = require('../../config/logger');

// Mock logger pour éviter les vraies écritures de logs
jest.mock('../../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
// Mock User model
jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const authMiddleware = require('../../middleware/auth.middleware');

// ===== Error Middleware =====
describe('Error Middleware', () => {
  test('should return 500 with error message by default', () => {
    const err = new Error('Test error');
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Test error'
    }));
  });

  test('should return custom status if err.status is set', () => {
    const err = new Error('Not found');
    err.status = 404;
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ===== Auth Middleware =====
describe('Auth Middleware', () => {
  test('should return 401 if no token provided', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  test('should return 401 if token is invalid', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

    const req = { headers: { authorization: 'Bearer invalidtoken' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  test('should return 401 if user not found', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    User.findByPk.mockResolvedValue(null);

    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  test('should call next if token valid and user found', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    User.findByPk.mockResolvedValue({ id: 1, email: 'test@test.com' });

    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ===== Logger =====
describe('Logger', () => {
  test('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  test('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });
});
