const { Task } = require("../models");

class TaskRepository {
  // Create
  async create(data) {
    return await Task.create(data);
  }

  // Read by ID
  async findById(id, userId) {
    return await Task.findOne({
      where: { id, userId },
    });
  }

  // Read all for user
  async findByUserId(userId, filters = {}) {
    const where = { userId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return await Task.findAll({
      where,
      order: [[filters.sortBy || "createdAt", "DESC"]],
    });
  }

  // Update
  async update(id, userId, data) {
    const task = await this.findById(id, userId);
    if (!task) return null;
    
    return await task.update(data);
  }

  // Delete
  async delete(id, userId) {
    const task = await this.findById(id, userId);
    if (!task) return false;
    
    await task.destroy();
    return true;
  }

  // Statistics
  async getStats(userId) {
    const total = await Task.count({ where: { userId } });
    const completed = await Task.count({ where: { userId, status: "done" } });
    const inProgress = await Task.count({ where: { userId, status: "in-progress" } });
    const todo = await Task.count({ where: { userId, status: "todo" } });

    return {
      total,
      completed,
      inProgress,
      todo,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
    };
  }
}

module.exports = new TaskRepository();
