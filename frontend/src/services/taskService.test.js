import taskService from './taskService';
import api from './api';

jest.mock('./api');

describe('taskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    test('should fetch tasks without filters', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await taskService.getTasks();

      expect(api.get).toHaveBeenCalledWith('/tasks?');
      expect(result).toEqual(mockTasks);
    });

    test('should fetch tasks with status filter', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await taskService.getTasks({ status: 'todo' });

      expect(api.get).toHaveBeenCalledWith('/tasks?status=todo');
      expect(result).toEqual(mockTasks);
    });

    test('should fetch tasks with priority filter', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await taskService.getTasks({ priority: 'high' });

      expect(api.get).toHaveBeenCalledWith('/tasks?priority=high');
      expect(result).toEqual(mockTasks);
    });

    test('should fetch tasks with sortBy filter', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await taskService.getTasks({ sortBy: 'deadline' });

      expect(api.get).toHaveBeenCalledWith('/tasks?sortBy=deadline');
      expect(result).toEqual(mockTasks);
    });

    test('should fetch tasks with multiple filters', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const result = await taskService.getTasks({ 
        status: 'todo', 
        priority: 'high',
        sortBy: 'deadline'
      });

      expect(api.get).toHaveBeenCalledWith('/tasks?status=todo&priority=high&sortBy=deadline');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getStats', () => {
    test('should fetch task statistics', async () => {
      const mockStats = { total: 10, todo: 3, inProgress: 2, completed: 5 };
      api.get.mockResolvedValue({ data: mockStats });

      const result = await taskService.getStats();

      expect(api.get).toHaveBeenCalledWith('/tasks/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('createTask', () => {
    test('should create a new task', async () => {
      const taskData = { title: 'New Task', priority: 'medium' };
      const mockTask = { id: 1, ...taskData };
      api.post.mockResolvedValue({ data: mockTask });

      const result = await taskService.createTask(taskData);

      expect(api.post).toHaveBeenCalledWith('/tasks', taskData);
      expect(result).toEqual(mockTask);
    });
  });

  describe('updateTask', () => {
    test('should update an existing task', async () => {
      const taskId = 1;
      const taskData = { title: 'Updated Task', status: 'done' };
      const mockTask = { id: 1, ...taskData };
      api.put.mockResolvedValue({ data: mockTask });

      const result = await taskService.updateTask(taskId, taskData);

      expect(api.put).toHaveBeenCalledWith(`/tasks/${taskId}`, taskData);
      expect(result).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    test('should delete a task', async () => {
      const taskId = 1;
      const mockResponse = { message: 'Task deleted successfully' };
      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await taskService.deleteTask(taskId);

      expect(api.delete).toHaveBeenCalledWith(`/tasks/${taskId}`);
      expect(result).toEqual(mockResponse);
    });
  });
});
