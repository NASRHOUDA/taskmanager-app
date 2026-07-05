const validateCreateTask = (req, res, next) => {
  const { title, description, priority, dueDate } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required and must be a string" });
  }

  if (title.length > 255) {
    return res.status(400).json({ error: "Title must be less than 255 characters" });
  }

  if (description && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" });
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: "Invalid due date format" });
  }

  next();
};

const validateUpdateTask = (req, res, next) => {
  const { title, status, priority, dueDate } = req.body;

  if (title && (typeof title !== "string" || title.trim() === "")) {
    return res.status(400).json({ error: "Title must be a non-empty string" });
  }

  if (status && !["todo", "in-progress", "done"].includes(status)) {
    return res.status(400).json({ error: "Status must be todo, in-progress, or done" });
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: "Invalid due date format" });
  }

  next();
};

module.exports = { validateCreateTask, validateUpdateTask };
