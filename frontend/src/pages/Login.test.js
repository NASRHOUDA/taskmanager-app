import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  localStorage.clear();
});

test('submits the credentials and navigates to /home on success', async () => {
  const login = jest.fn().mockResolvedValue(true);
  useAuth.mockReturnValue({ login });

  renderLogin();

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'secret' },
  });
  fireEvent.click(screen.getByText('Sign in →'));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
  expect(login).toHaveBeenCalledWith('user@example.com', 'secret');
});

test('shows an error message and does not navigate when login fails', async () => {
  const login = jest.fn().mockResolvedValue(false);
  useAuth.mockReturnValue({ login });

  renderLogin();

  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: 'user@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), {
    target: { value: 'wrong-password' },
  });
  fireEvent.click(screen.getByText('Sign in →'));

  expect(
    await screen.findByText('Invalid email or password. Please try again.')
  ).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('reads a token from the URL and stores it on mount', () => {
  const login = jest.fn();
  useAuth.mockReturnValue({ login });
  delete window.location;
  window.location = { search: '?token=abc123', href: '' };

  render(
    <MemoryRouter initialEntries={['/login?token=abc123']}>
      <Login />
    </MemoryRouter>
  );

  expect(localStorage.getItem('token')).toBe('abc123');
});

test('toggles password visibility when the eye icon is clicked', () => {
  useAuth.mockReturnValue({ login: jest.fn() });

  renderLogin();

  const passwordInput = screen.getByPlaceholderText('••••••••');
  expect(passwordInput).toHaveAttribute('type', 'password');

  const toggleButton = passwordInput.parentElement.querySelector(
    'button[type="button"]'
  );
  fireEvent.click(toggleButton);

  expect(passwordInput).toHaveAttribute('type', 'text');
});
