const validateCreateTask = (req, res, next) => {
  const { title, description, priority, dueDate } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    console.warn(`Validation failed: Title is required and must be a string`);
    return res.status(400).json({ error: "Title is required and must be a string" });
  }

  if (title.length > 255) {
    console.warn(`Validation failed: Title must be less than 255 characters`);
    return res.status(400).json({ error: "Title must be less than 255 characters" });
  }

  if (description && typeof description !== "string") {
    console.warn(`Validation failed: Description must be a string`);
    return res.status(400).json({ error: "Description must be a string" });
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    console.warn(`Validation failed: Priority must be low, medium, or high`);
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    console.warn(`Validation failed: Invalid due date format`);
    return res.status(400).json({ error: "Invalid due date format" });
  }

  next();
};

const validateUpdateTask = (req, res, next) => {
  const { title, status, priority, dueDate } = req.body;

  if (title && (typeof title !== "string" || title.trim() === "")) {
    console.warn(`Validation failed: Title must be a non-empty string`);
    return res.status(400).json({ error: "Title must be a non-empty string" });
  }

  if (status && !["todo", "in-progress", "done"].includes(status)) {
    console.warn(`Validation failed: Status must be todo, in-progress, or done`);
    return res.status(400).json({ error: "Status must be todo, in-progress, or done" });
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    console.warn(`Validation failed: Priority must be low, medium, or high`);
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
  }

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    console.warn(`Validation failed: Invalid due date format`);
    return res.status(400).json({ error: "Invalid due date format" });
  }

  next();
};

module.exports = { validateCreateTask, validateUpdateTask };
