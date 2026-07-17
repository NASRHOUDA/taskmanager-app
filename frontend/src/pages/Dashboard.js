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
    deadline: '',
  });

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
      // datetime-local attend le format "YYYY-MM-DDTHH:mm"
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (globalThis.confirm('Are you sure you want to delete this task?')) {
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

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'todo') return 'in-progress';
    if (currentStatus === 'in-progress') return 'done';
    return 'todo';
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = getNextStatus(task.status);
    try {
      await taskService.updateTask(task.id, { status: nextStatus });
      loadTasks();
      loadStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', deadline: '' });
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
        return '#e53935';
      case 'medium':
        return '#fb8c00';
      case 'low':
        return '#43a047';
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

  const isOverdue = (task) => {
    return task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date();
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <div className="dashboard-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.3"/>
            </svg>
          </div>
          <h1>Task Manager Dashboard</h1>
        </div>
        <div className="header-actions">
          <button className="btn-profile" onClick={() => navigate('/profile')} title="Profile">
            👤 Profile
          </button>
          <button className="btn-logout" onClick={handleLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="welcome-section">
        Welcome, <strong>{user?.name || user?.email}</strong>! 👋
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
        <button
          type="button"
          className="task-form-container"
          aria-label="Close form"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div className="task-form">
            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleCreateTask}>
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                type="text"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
              <div className="form-row">
                <div>
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="task-deadline">Deadline</label>
                  <input
                    id="task-deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <p className="deadline-hint">
                ⏰ If the deadline passes before the task is marked "Done", you'll get an email alert automatically.
              </p>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </button>
      )}

      {/* Filters */}
      <div className="filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value=""> Status</option>
          <option value="todo">📌 To Do </option>
          <option value="in-progress">⏳ In Progress</option>
          <option value="done">✅ Done</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
        >
          <option value="">Priorities test123
          
 </option>
          <option value="low">🟢 low </option>
          <option value="medium">🟡 Medium  </option>
          <option value="high">🔴 High</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {renderTasksList()}
      </div>
    </div>
  );

  function renderTasksList() {
    if (loading) {
      return <p>Loading tasks...</p>;
    }
    if (tasks.length === 0) {
      return <p className="no-tasks">No tasks found. Create one to get started! ✨</p>;
    }
    return (
          <div className="tasks-grid">
            {tasks.map((task) => {
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className={`task-card ${overdue ? 'overdue' : ''}`}>
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
                    {task.deadline && (
                      <span className={`task-deadline ${overdue ? 'overdue-tag' : ''}`}>
                        {overdue ? '⚠️ Overdue —' : '⏰'} {new Date(task.deadline).toLocaleString()}
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
              );
            })}
      </div>
    );
  }
}

export default Dashboard;
