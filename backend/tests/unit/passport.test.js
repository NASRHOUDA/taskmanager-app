describe('Passport Config', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should load with Google credentials', () => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'fake-id';
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'fake-secret';
    process.env.BACKEND_URL = 'http://localhost:5000';
    const passport = require('../../config/passport');
    expect(passport).toBeDefined();
  });

  test('should load without Google credentials', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const passport = require('../../config/passport');
    expect(passport).toBeDefined();
  });

  test('should load with NODE_ENV=test without errors', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const passport = require('../../config/passport');
    expect(passport).toBeDefined();
  });

  test('should handle missing callbackURL gracefully', () => {
    delete process.env.BACKEND_URL;
    process.env.GOOGLE_CLIENT_ID = 'fake-id';
    process.env.GOOGLE_CLIENT_SECRET = 'fake-secret';
    const passport = require('../../config/passport');
    expect(passport).toBeDefined();
  });
});
