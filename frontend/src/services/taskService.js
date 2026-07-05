// Détecte automatiquement l'URL selon le contexte
const getApiUrl = () => {
  // En développement
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // En Kubernetes (depuis React dans le cluster)
  if (process.env.NODE_ENV === "production") {
    return "http://backend-service.taskmanager.svc.cluster.local:5000/api";
  }

  // En dev local par défaut
  return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

const taskService = {
  // Get all tasks
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    const response = await fetch(`${API_URL}/tasks?${params}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  // Get task statistics
  getStats: async () => {
    const response = await fetch(`${API_URL}/tasks/stats`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  // Create task
  createTask: async (taskData) => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create task");
    }
    return response.json();
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update task");
    }
    return response.json();
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete task");
    }
    return response.json();
  },
};

export default taskService;
