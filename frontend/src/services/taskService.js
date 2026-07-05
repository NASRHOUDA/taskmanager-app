import api from "./api";

const taskService = {
  // Get all tasks
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    const response = await api.get(`/tasks?${params}`);
    return response.data;
  },

  // Get task statistics
  getStats: async () => {
    const response = await api.get("/tasks/stats");
    return response.data;
  },

  // Create task
  createTask: async (taskData) => {
    const response = await api.post("/tasks", taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

export default taskService;
