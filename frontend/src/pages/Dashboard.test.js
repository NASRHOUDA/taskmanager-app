import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import taskService from '../services/taskService';

// Mock the auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock task service
jest.mock('../services/taskService');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component', () => {
  const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    require('../context/AuthContext').useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
    window.confirm = jest.fn(() => true);
  });

  const mockTasks = [
    { id: 1, title: 'Task 1', description: 'Description 1', priority: 'high', status: 'todo', deadline: '2026-12-31T10:00:00' },
    { id: 2, title: 'Task 2', description: 'Description 2', priority: 'medium', status: 'in-progress', deadline: null },
    { id: 3, title: 'Task 3', description: '', priority: 'low', status: 'done', deadline: '2025-01-01T10:00:00' },
  ];

  const mockStats = {
    total: 10,
    todo: 3,
    inProgress: 2,
    completed: 5,
    completionRate: 50,
  };

  test('renders welcome message and dashboard title', async () => {
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test User!/i)).toBeInTheDocument();
      expect(screen.getByText('Task Manager Dashboard')).toBeInTheDocument();
    });
  });

  test('shows loading state', () => {
    taskService.getTasks.mockImplementation(() => new Promise(() => {}));
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  test('renders stats cards correctly', async () => {
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  test('renders tasks list with correct status badges', async () => {
    taskService.getTasks.mockResolvedValue(mockTasks);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  test('shows overdue indicator for overdue tasks', async () => {
    const overdueTask = { 
      id: 4, 
      title: 'Overdue Task', 
      description: 'This is overdue', 
      priority: 'high', 
      status: 'todo', 
      deadline: '2020-01-01T10:00:00' 
    };
    taskService.getTasks.mockResolvedValue([overdueTask]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('⚠️ Overdue —')).toBeInTheDocument();
    });
  });

  test('shows no tasks message when empty', async () => {
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks found. Create one to get started! ✨')).toBeInTheDocument();
    });
  });

  test('opens and closes create task form', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const createButton = screen.getByText('➕ Create New Task');
    await user.click(createButton);

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Task title')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });
  });

  test('creates a new task successfully', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.createTask.mockResolvedValue({ id: 1, title: 'New Task' });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const createButton = screen.getByText('➕ Create New Task');
    await user.click(createButton);

    const titleInput = screen.getByPlaceholderText('Task title');
    await user.type(titleInput, 'New Task');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Task' })
      );
    });
  });

  test('handles task creation error', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.createTask.mockRejectedValue(new Error('Creation failed'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const createButton = screen.getByText('➕ Create New Task');
    await user.click(createButton);

    const titleInput = screen.getByPlaceholderText('Task title');
    await user.type(titleInput, 'New Task');

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(taskService.createTask).toHaveBeenCalled();
    });
  });

  test('edits a task', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue(mockTasks);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.updateTask.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('✏️ Edit');
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    
    const titleInput = screen.getByPlaceholderText('Task title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task');

    const updateButton = screen.getByText('Update Task');
    await user.click(updateButton);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Updated Task',
      }));
    });
  });

  test('deletes a task with confirmation', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue(mockTasks);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.deleteTask.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('🗑️ Delete');
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
    expect(taskService.deleteTask).toHaveBeenCalledWith(1);
  });

  test('toggles task status from todo to in-progress', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue(mockTasks);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.updateTask.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    const statusButtons = screen.getAllByText('→ Next');
    await user.click(statusButtons[0]);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith(1, { status: 'in-progress' });
    });
  });

  test('toggles task status from done to todo (reopen)', async () => {
    const user = userEvent.setup();
    const doneTasks = [{ id: 3, title: 'Done Task', status: 'done', priority: 'low', deadline: null }];
    taskService.getTasks.mockResolvedValue(doneTasks);
    taskService.getStats.mockResolvedValue(mockStats);
    taskService.updateTask.mockResolvedValue({});

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Done Task')).toBeInTheDocument();
    });

    const reopenButton = screen.getByText('↩️ Reopen');
    await user.click(reopenButton);

    await waitFor(() => {
      expect(taskService.updateTask).toHaveBeenCalledWith(3, { status: 'todo' });
    });
  });

  test('filters tasks by status', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const statusFilter = screen.getByRole('combobox', { name: '' });
    await user.selectOptions(statusFilter, 'todo');

    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'todo' })
      );
    });
  });

  test('filters tasks by priority', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const priorityFilter = screen.getByRole('combobox', { name: '' });
    // The second combobox is priority filter
    const prioritySelects = screen.getAllByRole('combobox');
    await user.selectOptions(prioritySelects[1], 'high');

    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });
  });

  test('handles logout', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const logoutButton = screen.getByText('🚪 Logout');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates to profile', async () => {
    const user = userEvent.setup();
    taskService.getTasks.mockResolvedValue([]);
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const profileButton = screen.getByText('👤 Profile');
    await user.click(profileButton);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('handles task loading error', async () => {
    taskService.getTasks.mockRejectedValue(new Error('Failed to load tasks'));
    taskService.getStats.mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks found. Create one to get started! ✨')).toBeInTheDocument();
    });
  });
});
