describe('Logger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should load logger module without errors', () => {
    const logger = require('../../config/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('should log info message without throwing', () => {
    const logger = require('../../config/logger');
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  test('should log error message without throwing', () => {
    const logger = require('../../config/logger');
    expect(() => logger.error('Test error message')).not.toThrow();
  });

  test('should log warn message without throwing', () => {
    const logger = require('../../config/logger');
    expect(() => logger.warn('Test warn message')).not.toThrow();
  });

  test('should log debug message without throwing', () => {
    const logger = require('../../config/logger');
    expect(() => logger.debug('Test debug message')).not.toThrow();
  });
});
