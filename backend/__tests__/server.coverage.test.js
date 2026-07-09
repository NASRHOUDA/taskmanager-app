// This test ensures server.js is loaded and covered
describe('Server Module', () => {
  test('should load server module without errors', () => {
    // Mock process.exit to prevent actual exit during tests
    const originalExit = process.exit;
    process.exit = jest.fn();
    
    // Load the server module
    const server = require('../server');
    
    // Verify the module exports
    expect(server).toBeDefined();
    
    // Restore process.exit
    process.exit = originalExit;
  });
});
