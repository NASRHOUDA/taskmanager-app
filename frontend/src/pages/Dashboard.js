import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';
import toast from 'react-hot-toast';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  // Charger les tâches et statistiques
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(filter);
      setTasks(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await taskService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, formData);
        toast.success('Task updated successfully');
      } else {
        await taskService.createTask(formData);
        toast.success('Task created successfully');
      }
      resetForm();
      loadTasks();
      loadStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        toast.success('Task deleted successfully');
        loadTasks();
        loadStats();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
    try {
      await taskService.updateTask(task.id, { status: nextStatus });
      loadTasks();
      loadStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setEditingTask(null);
    setShowForm(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#44aa44';
      default:
        return '#888';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return '✅';
      case 'in-progress':
        return '⏳';
      default:
        return '📌';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📋 TaskManager Dashboard</h1>
        <div className="header-actions">
          <button
            className="btn-profile"
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            👤 Profile
          </button>
          <button
            className="btn-logout"
            onClick={handleLogout}
            title="Logout"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="welcome-section">
        <p>Welcome, <strong>{user?.name || user?.email}</strong>! 👋</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.todo}</div>
            <div className="stat-label">To Do</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Create Task Button */}
      <button
        className="btn-create"
        onClick={() => {
          resetForm();
          setShowForm(true);
        }}
      >
        ➕ Create New Task
      </button>

      {/* Task Form */}
      {showForm && (
        <div className="task-form-container">
          <div className="task-form">
            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleCreateTask}>
              <input
                type="text"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
              <div className="form-row">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">🟢 Low Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="high">🔴 High Priority</option>
                </select>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="todo">📌 To Do</option>
          <option value="in-progress">⏳ In Progress</option>
          <option value="done">✅ Done</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="no-tasks">No tasks found. Create one to get started! ✨</p>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span
                    className="task-priority"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                    title={task.priority}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-meta">
                  {task.dueDate && (
                    <span className="task-date">
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="task-status">
                    {getStatusIcon(task.status)} {task.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="task-actions">
                  <button
                    className="btn-status"
                    onClick={() => handleToggleStatus(task)}
                    title="Change status"
                  >
                    {task.status === 'done' ? '↩️ Reopen' : '→ Next'}
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEditTask(task)}
                    title="Edit task"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
