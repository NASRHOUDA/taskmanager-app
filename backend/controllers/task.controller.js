const TaskService = require("../services/TaskService");

// Create a new task
exports.createTask = async (req, res, next) => {
  try {
    const task = await TaskService.createTask(req.user.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// Get all tasks for the current user
exports.getUserTasks = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      sortBy: req.query.sortBy || "createdAt",
    };
    const tasks = await TaskService.getTasks(req.user.id, filters);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.user.id, req.params.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

// Update a task
exports.updateTask = async (req, res, next) => {
  try {
    const task = await TaskService.updateTask(req.user.id, req.params.id, req.body);
    res.json(task);
  } catch (error) {
    next(error);
  }
};

// Delete a task
exports.deleteTask = async (req, res, next) => {
  try {
    const result = await TaskService.deleteTask(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Get task statistics
exports.getTaskStats = async (req, res, next) => {
  try {
    const stats = await TaskService.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
