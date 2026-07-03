import '@testing-library/jest-dom';

// Mock axios pour tous les tests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      baseURL: '/api',
      headers: { common: {} }
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })),
  defaults: {
    baseURL: '/api',
    headers: { common: {} }
  }
}));
