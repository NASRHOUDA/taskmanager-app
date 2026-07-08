const errorHandler = require("../errorHandler.middleware");

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    console.error = jest.fn(); // Mock console.error
  });

  test("should handle ValidationError", () => {
    const err = new Error("Validation failed");
    err.name = "ValidationError";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Validation failed" });
    expect(console.error).toHaveBeenCalledWith("Error:", "Validation failed");
  });

  test("should handle Task not found error", () => {
    const err = new Error("Task not found");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
  });

  test("should handle not found error", () => {
    const err = new Error("Resource not found");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Resource not found" });
  });

  test("should handle past deadline error", () => {
    const err = new Error("Due date cannot be in the past");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Due date cannot be in the past" });
  });

  test("should handle required field error", () => {
    const err = new Error("Task title is required");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Task title is required" });
  });

  test("should handle Unauthorized error", () => {
    const err = new Error("Unauthorized");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  test("should handle Forbidden error", () => {
    const err = new Error("Forbidden");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });

  test("should handle generic errors with 500 status", () => {
    const err = new Error("Something went wrong");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
