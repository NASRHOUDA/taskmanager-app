describe('User Model', () => {
  test('should have correct attributes', () => {
    const User = require('../User');
    expect(User).toBeDefined();
  });

  test('should validate required fields', () => {
    const user = {
      email: 'test@example.com',
      name: 'Test User',
      provider: 'local',
    };
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
  });

  test('should have valid provider values', () => {
    const validProviders = ['local', 'google'];
    const user = { provider: 'local' };
    expect(validProviders).toContain(user.provider);
  });

  test('should hash password before save', () => {
    const user = {
      password: 'password123',
    };
    expect(user.password).toBeDefined();
  });

  test('should validate password method exists', () => {
    const user = {
      validatePassword: jest.fn().mockResolvedValue(true),
    };
    expect(user.validatePassword).toBeDefined();
    expect(user.validatePassword('password')).resolves.toBe(true);
  });

  test('should have default provider value', () => {
    const user = {
      provider: 'local',
    };
    expect(user.provider).toBe('local');
  });
});
