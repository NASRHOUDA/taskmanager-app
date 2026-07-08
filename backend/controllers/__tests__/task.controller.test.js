const taskController = require('../task.controller');
const TaskService = require('../../services/TaskService');

jest.mock('../../services/TaskService');

describe('Task Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 123 },
      params: {},
      query: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('createTask', () => {
    test('should create a task successfully', async () => {
      req.body = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
      };
      const mockTask = { id: 1, ...req.body, userId: 123 };
      TaskService.createTask.mockResolvedValue(mockTask);

      await taskController.createTask(req, res, next);

      expect(TaskService.createTask).toHaveBeenCalledWith(123, req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next with error on failure', async () => {
      req.body = { title: 'New Task' };
      const error = new Error('Creation failed');
      TaskService.createTask.mockRejectedValue(error);

      await taskController.createTask(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserTasks', () => {
    test('should get tasks with filters', async () => {
      req.query = {
        status: 'todo',
        priority: 'high',
        sortBy: 'deadline',
      };
      const mockTasks = [{ id: 1, title: 'Task 1' }, { id: 2, title: 'Task 2' }];
      TaskService.getTasks.mockResolvedValue(mockTasks);

      await taskController.getUserTasks(req, res, next);

      expect(TaskService.getTasks).toHaveBeenCalledWith(123, {
        status: 'todo',
        priority: 'high',
        sortBy: 'deadline',
      });
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should get tasks with default sortBy', async () => {
      req.query = { status: 'todo' };
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      TaskService.getTasks.mockResolvedValue(mockTasks);

      await taskController.getUserTasks(req, res, next);

      expect(TaskService.getTasks).toHaveBeenCalledWith(123, {
        status: 'todo',
        sortBy: 'createdAt',
      });
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should get tasks without filters', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      TaskService.getTasks.mockResolvedValue(mockTasks);

      await taskController.getUserTasks(req, res, next);

      expect(TaskService.getTasks).toHaveBeenCalledWith(123, {
        sortBy: 'createdAt',
      });
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should call next with error on failure', async () => {
      const error = new Error('Fetch failed');
      TaskService.getTasks.mockRejectedValue(error);

      await taskController.getUserTasks(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTaskById', () => {
    test('should get a task by id', async () => {
      req.params = { id: '1' };
      const mockTask = { id: 1, title: 'Task 1', userId: 123 };
      TaskService.getTaskById.mockResolvedValue(mockTask);

      await taskController.getTaskById(req, res, next);

      expect(TaskService.getTaskById).toHaveBeenCalledWith(123, '1');
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should call next with error on failure', async () => {
      req.params = { id: '999' };
      const error = new Error('Task not found');
      TaskService.getTaskById.mockRejectedValue(error);

      await taskController.getTaskById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTask', () => {
    test('should update a task successfully', async () => {
      req.params = { id: '1' };
      req.body = { title: 'Updated Task', status: 'done' };
      const mockTask = { id: 1, title: 'Updated Task', status: 'done' };
      TaskService.updateTask.mockResolvedValue(mockTask);

      await taskController.updateTask(req, res, next);

      expect(TaskService.updateTask).toHaveBeenCalledWith(123, '1', req.body);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    test('should call next with error on failure', async () => {
      req.params = { id: '1' };
      req.body = { title: 'Updated Task' };
      const error = new Error('Update failed');
      TaskService.updateTask.mockRejectedValue(error);

      await taskController.updateTask(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteTask', () => {
    test('should delete a task successfully', async () => {
      req.params = { id: '1' };
      const mockResult = { message: 'Task deleted successfully' };
      TaskService.deleteTask.mockResolvedValue(mockResult);

      await taskController.deleteTask(req, res, next);

      expect(TaskService.deleteTask).toHaveBeenCalledWith(123, '1');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('should call next with error on failure', async () => {
      req.params = { id: '999' };
      const error = new Error('Task not found');
      TaskService.deleteTask.mockRejectedValue(error);

      await taskController.deleteTask(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTaskStats', () => {
    test('should get task statistics', async () => {
      const mockStats = {
        total: 10,
        completed: 3,
        inProgress: 2,
        todo: 5,
        completionRate: 30,
      };
      TaskService.getStats.mockResolvedValue(mockStats);

      await taskController.getTaskStats(req, res, next);

      expect(TaskService.getStats).toHaveBeenCalledWith(123);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });

    test('should call next with error on failure', async () => {
      const error = new Error('Stats fetch failed');
      TaskService.getStats.mockRejectedValue(error);

      await taskController.getTaskStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
