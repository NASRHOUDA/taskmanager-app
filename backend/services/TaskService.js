const TaskRepository = require("../repositories/TaskRepository");

class TaskService {
  // Create task avec validation
  async createTask(userId, data) {
    if (!data.title || data.title.trim() === "") {
      throw new Error("Task title is required");
    }

    if (data.dueDate && new Date(data.dueDate) < new Date()) {
      throw new Error("Due date cannot be in the past");
    }

    return await TaskRepository.create({
      userId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      status: "todo",
    });
  }

  // Get all tasks
  async getTasks(userId, filters) {
    return await TaskRepository.findByUserId(userId, filters);
  }

  // Get single task
  async getTaskById(userId, taskId) {
    const task = await TaskRepository.findById(taskId, userId);
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  }

  // Update task
  async updateTask(userId, taskId, data) {
    const task = await TaskRepository.findById(taskId, userId);
    if (!task) {
      throw new Error("Task not found");
    }

    const updateData = {};
    if (data.title) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.status && ["todo", "in-progress", "done"].includes(data.status)) {
      updateData.status = data.status;
    }
    if (data.priority && ["low", "medium", "high"].includes(data.priority)) {
      updateData.priority = data.priority;
    }
    if (data.dueDate) {
      if (new Date(data.dueDate) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      updateData.dueDate = data.dueDate;
    }

    return await TaskRepository.update(taskId, userId, updateData);
  }

  // Delete task
  async deleteTask(userId, taskId) {
    const deleted = await TaskRepository.delete(taskId, userId);
    if (!deleted) {
      throw new Error("Task not found");
    }
    return { message: "Task deleted successfully" };
  }

  // Get statistics
  async getStats(userId) {
    return await TaskRepository.getStats(userId);
  }
}

module.exports = new TaskService();
