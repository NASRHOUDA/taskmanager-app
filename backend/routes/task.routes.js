const express = require("express");
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validateCreateTask, validateUpdateTask } = require("../middleware/validation.middleware");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Task CRUD with validation
router.post("/", validateCreateTask, taskController.createTask);
router.get("/stats", taskController.getTaskStats);
router.get("/", taskController.getUserTasks);
router.get("/:id", taskController.getTaskById);
router.put("/:id", validateUpdateTask, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
