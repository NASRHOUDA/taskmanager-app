const TaskRepository = require("../TaskRepository");
const { Task } = require("../../models");

jest.mock("../../models", () => ({
  Task: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

describe("TaskRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = 123;
  const mockTaskData = {
    id: 1,
    title: "Test Task",
    userId: mockUserId,
    status: "todo",
  };

  describe("create", () => {
    test("should create a new task", async () => {
      Task.create.mockResolvedValue(mockTaskData);

      const result = await TaskRepository.create(mockTaskData);

      expect(Task.create).toHaveBeenCalledWith(mockTaskData);
      expect(result).toEqual(mockTaskData);
    });
  });

  describe("findById", () => {
    test("should find a task by id and userId", async () => {
      Task.findOne.mockResolvedValue(mockTaskData);

      const result = await TaskRepository.findById(1, mockUserId);

      expect(Task.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUserId },
      });
      expect(result).toEqual(mockTaskData);
    });

    test("should return null if task not found", async () => {
      Task.findOne.mockResolvedValue(null);

      const result = await TaskRepository.findById(999, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    test("should find all tasks for a user", async () => {
      const mockTasks = [mockTaskData, { id: 2, title: "Task 2", userId: mockUserId }];
      Task.findAll.mockResolvedValue(mockTasks);

      const result = await TaskRepository.findByUserId(mockUserId, {});

      expect(Task.findAll).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockTasks);
    });

    test("should filter by status", async () => {
      const filters = { status: "todo" };
      Task.findAll.mockResolvedValue([mockTaskData]);

      await TaskRepository.findByUserId(mockUserId, filters);

      expect(Task.findAll).toHaveBeenCalledWith({
        where: { userId: mockUserId, status: "todo" },
        order: [["createdAt", "DESC"]],
      });
    });

    test("should filter by priority", async () => {
      const filters = { priority: "high" };
      Task.findAll.mockResolvedValue([mockTaskData]);

      await TaskRepository.findByUserId(mockUserId, filters);

      expect(Task.findAll).toHaveBeenCalledWith({
        where: { userId: mockUserId, priority: "high" },
        order: [["createdAt", "DESC"]],
      });
    });

    test("should sort by custom field", async () => {
      const filters = { sortBy: "deadline" };
      Task.findAll.mockResolvedValue([mockTaskData]);

      await TaskRepository.findByUserId(mockUserId, filters);

      expect(Task.findAll).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: [["deadline", "DESC"]],
      });
    });
  });

  describe("update", () => {
    test("should update a task", async () => {
      const mockTask = {
        ...mockTaskData,
        update: jest.fn().mockResolvedValue({ ...mockTaskData, title: "Updated" }),
      };
      Task.findOne.mockResolvedValue(mockTask);

      const result = await TaskRepository.update(1, mockUserId, { title: "Updated" });

      expect(mockTask.update).toHaveBeenCalledWith({ title: "Updated" });
      expect(result).toEqual({ ...mockTaskData, title: "Updated" });
    });

    test("should return null if task not found", async () => {
      Task.findOne.mockResolvedValue(null);

      const result = await TaskRepository.update(999, mockUserId, { title: "Updated" });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("should delete a task", async () => {
      const mockTask = {
        ...mockTaskData,
        destroy: jest.fn().mockResolvedValue(true),
      };
      Task.findOne.mockResolvedValue(mockTask);

      const result = await TaskRepository.delete(1, mockUserId);

      expect(mockTask.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("should return false if task not found", async () => {
      Task.findOne.mockResolvedValue(null);

      const result = await TaskRepository.delete(999, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe("getStats", () => {
    test("should get task statistics for a user", async () => {
      Task.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(3)   // completed
        .mockResolvedValueOnce(2)   // inProgress
        .mockResolvedValueOnce(5);  // todo

      const result = await TaskRepository.getStats(mockUserId);

      expect(Task.count).toHaveBeenCalledTimes(4);
      expect(Task.count).toHaveBeenCalledWith({ where: { userId: mockUserId } });
      expect(Task.count).toHaveBeenCalledWith({ where: { userId: mockUserId, status: "done" } });
      expect(Task.count).toHaveBeenCalledWith({ where: { userId: mockUserId, status: "in-progress" } });
      expect(Task.count).toHaveBeenCalledWith({ where: { userId: mockUserId, status: "todo" } });
      
      expect(result).toEqual({
        total: 10,
        completed: 3,
        inProgress: 2,
        todo: 5,
        completionRate: "30.00",
      });
    });

    test("should handle zero total tasks", async () => {
      Task.count
        .mockResolvedValueOnce(0)   // total
        .mockResolvedValueOnce(0)   // completed
        .mockResolvedValueOnce(0)   // inProgress
        .mockResolvedValueOnce(0);  // todo

      const result = await TaskRepository.getStats(mockUserId);

      expect(result.completionRate).toBe(0);
    });
  });
});
