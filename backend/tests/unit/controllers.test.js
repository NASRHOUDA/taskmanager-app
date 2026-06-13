// Mock models
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  },
  Task: {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('fake-token'),
  verify: jest.fn()
}));

const { User, Task } = require('../../models');
const { register, login, getMe } = require('../../controllers/auth.controller');
const { getAllTasks, createTask, updateTask, deleteTask } = require('../../controllers/task.controller');

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

// ===== Task Controller =====
describe('Task Controller', () => {

  beforeEach(() => jest.clearAllMocks());

  describe('getAllTasks', () => {
    test('should return all tasks for user', async () => {
      Task.findAll.mockResolvedValue([{ id: 1, title: 'Task 1' }]);
      const req = { user: { id: 1 } };
      const res = mockRes();

      await getAllTasks(req, res);

      expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'Task 1' }]);
    });

    test('should return 500 on error', async () => {
      Task.findAll.mockRejectedValue(new Error('DB error'));
      const req = { user: { id: 1 } };
      const res = mockRes();

      await getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createTask', () => {
    test('should create and return task', async () => {
      Task.create.mockResolvedValue({ id: 1, title: 'New Task' });
      const req = { body: { title: 'New Task' }, user: { id: 1 } };
      const res = mockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return 500 on error', async () => {
      Task.create.mockRejectedValue(new Error('DB error'));
      const req = { body: { title: 'New Task' }, user: { id: 1 } };
      const res = mockRes();

      await createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTask', () => {
    test('should return 404 if task not found', async () => {
      Task.findOne.mockResolvedValue(null);
      const req = { params: { id: 99 }, body: { title: 'Updated' }, user: { id: 1 } };
      const res = mockRes();

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should update and return task', async () => {
      const mockTask = { id: 1, title: 'Task', update: jest.fn().mockResolvedValue(true) };
      Task.findOne.mockResolvedValue(mockTask);
      const req = { params: { id: 1 }, body: { title: 'Updated' }, user: { id: 1 } };
      const res = mockRes();

      await updateTask(req, res);

      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should return 500 on error', async () => {
      Task.findOne.mockRejectedValue(new Error('DB error'));
      const req = { params: { id: 1 }, body: {}, user: { id: 1 } };
      const res = mockRes();

      await updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTask', () => {
    test('should return 404 if task not found', async () => {
      Task.findOne.mockResolvedValue(null);
      const req = { params: { id: 99 }, user: { id: 1 } };
      const res = mockRes();

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should delete task and return message', async () => {
      const mockTask = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Task.findOne.mockResolvedValue(mockTask);
      const req = { params: { id: 1 }, user: { id: 1 } };
      const res = mockRes();

      await deleteTask(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Task deleted successfully' });
    });

    test('should return 500 on error', async () => {
      Task.findOne.mockRejectedValue(new Error('DB error'));
      const req = { params: { id: 1 }, user: { id: 1 } };
      const res = mockRes();

      await deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
