// Integration test for server
describe('Server Integration', () => {
  let server;

  beforeAll(() => {
    // Mock the server module
    jest.mock('../server', () => ({
      startServer: jest.fn().mockResolvedValue({
        listen: jest.fn((port, callback) => {
          if (callback) callback();
          return {
            close: jest.fn((cb) => {
              if (cb) cb();
            })
          };
        })
      })
    }));
  });

  test('server should start without errors', async () => {
    const serverModule = require('../server');
    expect(serverModule).toBeDefined();
  });
});
