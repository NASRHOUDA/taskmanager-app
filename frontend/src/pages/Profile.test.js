import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

// Mock the auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Profile Component', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    provider: 'local',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockSetUser = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.confirm = jest.fn(() => true);
    
    require('../context/AuthContext').useAuth.mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
      logout: mockLogout,
    });
  });

  test('renders profile information correctly', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText('👤 User Profile')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('📧 Email')).toBeInTheDocument();
    expect(screen.getByText('✅ Active')).toBeInTheDocument();
  });

  test('shows avatar with first letter of name', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  test('shows Google provider badge for Google users', () => {
    require('../context/AuthContext').useAuth.mockReturnValue({
      user: { ...mockUser, provider: 'google' },
      setUser: mockSetUser,
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText('🔵 Google')).toBeInTheDocument();
  });

  test('opens edit profile form when Edit Profile button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const editButton = screen.getByText('✏️ Edit Profile');
    await user.click(editButton);

    expect(screen.getByText('Edit profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  test('handles profile update successfully', async () => {
    const user = userEvent.setup();
    const mockResponse = { user: { id: 1, name: 'Updated Name', email: 'test@example.com' } };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const editButton = screen.getByText('✏️ Edit Profile');
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveButton = screen.getByText('Save changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated Name' }),
        })
      );
    });
  });

  test('shows error when name is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const editButton = screen.getByText('✏️ Edit Profile');
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Test User');
    await user.clear(nameInput);

    const saveButton = screen.getByText('Save changes');
    await user.click(saveButton);

    // Check for toast error - the toast might not be in the DOM immediately
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  test('opens change password form for local users', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const passwordButton = screen.getByText('🔒 Change Password');
    await user.click(passwordButton);

    expect(screen.getByText('Change password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('shows disabled password button for Google users', () => {
    require('../context/AuthContext').useAuth.mockReturnValue({
      user: { ...mockUser, provider: 'google' },
      setUser: mockSetUser,
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const passwordButton = screen.getByText('🔒 Change Password');
    expect(passwordButton).toBeDisabled();
  });

  test('handles password change successfully', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const passwordButton = screen.getByText('🔒 Change Password');
    await user.click(passwordButton);

    const currentPassword = screen.getByPlaceholderText('••••••••');
    const newPassword = screen.getByPlaceholderText('Min. 6 characters');
    const confirmPassword = screen.getByPlaceholderText('Repeat new password');

    await user.type(currentPassword, 'oldpass123');
    await user.type(newPassword, 'newpass123');
    await user.type(confirmPassword, 'newpass123');

    const updateButton = screen.getByText('Update password');
    await user.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/change-password'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ currentPassword: 'oldpass123', newPassword: 'newpass123' }),
        })
      );
    });
  });

  test('validates password match', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const passwordButton = screen.getByText('🔒 Change Password');
    await user.click(passwordButton);

    const currentPassword = screen.getByPlaceholderText('••••••••');
    const newPassword = screen.getByPlaceholderText('Min. 6 characters');
    const confirmPassword = screen.getByPlaceholderText('Repeat new password');

    await user.type(currentPassword, 'oldpass123');
    await user.type(newPassword, 'newpass123');
    await user.type(confirmPassword, 'different');

    const updateButton = screen.getByText('Update password');
    await user.click(updateButton);

    // Check that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('handles logout', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const logoutButton = screen.getByText('🚪 Logout');
    await user.click(logoutButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to logout?');
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates back to dashboard', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const backButton = screen.getByText('← Back');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
