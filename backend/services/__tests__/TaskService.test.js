const TaskService = require("../TaskService");
const TaskRepository = require("../../repositories/TaskRepository");

jest.mock("../../repositories/TaskRepository");

describe("TaskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = 123;
  const mockTaskData = {
    title: "Test Task",
    description: "Test Description",
    priority: "high",
    deadline: "2026-12-31T23:59:59Z",
  };

  describe("createTask", () => {
    test("should create a task with valid data", async () => {
      const expectedTask = { id: 1, ...mockTaskData, userId: mockUserId, status: "todo" };
      TaskRepository.create.mockResolvedValue(expectedTask);

      const result = await TaskService.createTask(mockUserId, mockTaskData);

      expect(TaskRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        title: mockTaskData.title.trim(),
        description: mockTaskData.description.trim(),
        priority: mockTaskData.priority,
        deadline: mockTaskData.deadline,
        status: "todo",
      });
      expect(result).toEqual(expectedTask);
    });

    test("should throw error if title is missing", async () => {
      await expect(TaskService.createTask(mockUserId, { description: "test" }))
        .rejects.toThrow("Task title is required");
    });

    test("should throw error if title is empty string", async () => {
      await expect(TaskService.createTask(mockUserId, { title: "  " }))
        .rejects.toThrow("Task title is required");
    });

    test("should throw error if deadline is in the past", async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      await expect(TaskService.createTask(mockUserId, { title: "Test", deadline: pastDate }))
        .rejects.toThrow("Due date cannot be in the past");
    });

    test("should set default priority to medium if not provided", async () => {
      const dataWithoutPriority = { title: "Test Task" };
      TaskRepository.create.mockResolvedValue({ id: 1, ...dataWithoutPriority, priority: "medium" });

      await TaskService.createTask(mockUserId, dataWithoutPriority);

      expect(TaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "medium" })
      );
    });

    test("should set description to null if not provided", async () => {
      const dataWithoutDescription = { title: "Test Task" };
      TaskRepository.create.mockResolvedValue({ id: 1, ...dataWithoutDescription });

      await TaskService.createTask(mockUserId, dataWithoutDescription);

      expect(TaskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null })
      );
    });
  });

  describe("getTasks", () => {
    test("should get tasks for a user with filters", async () => {
      const mockTasks = [{ id: 1, title: "Task 1" }];
      const filters = { status: "todo", priority: "high", sortBy: "deadline" };
      TaskRepository.findByUserId.mockResolvedValue(mockTasks);

      const result = await TaskService.getTasks(mockUserId, filters);

      expect(TaskRepository.findByUserId).toHaveBeenCalledWith(mockUserId, filters);
      expect(result).toEqual(mockTasks);
    });

    test("should get tasks without filters", async () => {
      const mockTasks = [{ id: 1, title: "Task 1" }];
      TaskRepository.findByUserId.mockResolvedValue(mockTasks);

      const result = await TaskService.getTasks(mockUserId, {});

      expect(TaskRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {});
      expect(result).toEqual(mockTasks);
    });
  });

  describe("getTaskById", () => {
    test("should get a task by id", async () => {
      const mockTask = { id: 1, title: "Task 1", userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);

      const result = await TaskService.getTaskById(mockUserId, 1);

      expect(TaskRepository.findById).toHaveBeenCalledWith(1, mockUserId);
      expect(result).toEqual(mockTask);
    });

    test("should throw error if task not found", async () => {
      TaskRepository.findById.mockResolvedValue(null);

      await expect(TaskService.getTaskById(mockUserId, 999))
        .rejects.toThrow("Task not found");
    });
  });

  describe("updateTask", () => {
    test("should update a task with valid data", async () => {
      const mockTask = { 
        id: 1, 
        title: "Original Title", 
        userId: mockUserId,
        update: jest.fn().mockResolvedValue(true)
      };
      TaskRepository.findById.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({ id: 1, title: "Updated Title" });

      const result = await TaskService.updateTask(mockUserId, 1, { title: "Updated Title" });

      expect(TaskRepository.update).toHaveBeenCalledWith(1, mockUserId, { title: "Updated Title" });
      expect(result).toEqual({ id: 1, title: "Updated Title" });
    });

    test("should throw error if task not found", async () => {
      TaskRepository.findById.mockResolvedValue(null);

      await expect(TaskService.updateTask(mockUserId, 999, { title: "Update" }))
        .rejects.toThrow("Task not found");
    });

    test("should validate status value", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({ id: 1, status: "done" });

      await TaskService.updateTask(mockUserId, 1, { status: "done" });

      expect(TaskRepository.update).toHaveBeenCalledWith(1, mockUserId, { status: "done" });
    });

    test("should reject invalid status", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);

      await TaskService.updateTask(mockUserId, 1, { status: "invalid" });

      expect(TaskRepository.update).not.toHaveBeenCalledWith(
        1, 
        mockUserId, 
        expect.objectContaining({ status: "invalid" })
      );
    });

    test("should validate priority value", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({ id: 1, priority: "low" });

      await TaskService.updateTask(mockUserId, 1, { priority: "low" });

      expect(TaskRepository.update).toHaveBeenCalledWith(1, mockUserId, { priority: "low" });
    });

    test("should reject invalid priority", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);

      await TaskService.updateTask(mockUserId, 1, { priority: "invalid" });

      expect(TaskRepository.update).not.toHaveBeenCalledWith(
        1, 
        mockUserId, 
        expect.objectContaining({ priority: "invalid" })
      );
    });

    test("should throw error if deadline is in the past", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);
      const pastDate = new Date(Date.now() - 10000).toISOString();

      await expect(TaskService.updateTask(mockUserId, 1, { deadline: pastDate }))
        .rejects.toThrow("Due date cannot be in the past");
    });

    test("should handle description update", async () => {
      const mockTask = { id: 1, userId: mockUserId };
      TaskRepository.findById.mockResolvedValue(mockTask);
      TaskRepository.update.mockResolvedValue({ id: 1, description: "New desc" });

      await TaskService.updateTask(mockUserId, 1, { description: "New desc" });

      expect(TaskRepository.update).toHaveBeenCalledWith(1, mockUserId, { description: "New desc" });
    });
  });

  describe("deleteTask", () => {
    test("should delete a task", async () => {
      TaskRepository.delete.mockResolvedValue(true);

      const result = await TaskService.deleteTask(mockUserId, 1);

      expect(TaskRepository.delete).toHaveBeenCalledWith(1, mockUserId);
      expect(result).toEqual({ message: "Task deleted successfully" });
    });

    test("should throw error if task not found", async () => {
      TaskRepository.delete.mockResolvedValue(false);

      await expect(TaskService.deleteTask(mockUserId, 999))
        .rejects.toThrow("Task not found");
    });
  });

  describe("getStats", () => {
    test("should get task statistics", async () => {
      const mockStats = {
        total: 10,
        completed: 3,
        inProgress: 2,
        todo: 5,
        completionRate: 30.00,
      };
      TaskRepository.getStats.mockResolvedValue(mockStats);

      const result = await TaskService.getStats(mockUserId);

      expect(TaskRepository.getStats).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockStats);
    });
  });
});
