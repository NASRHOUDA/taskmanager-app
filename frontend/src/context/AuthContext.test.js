import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../services/api';

// api est mocké : on ne veut pas de vrais appels réseau dans un test unitaire.
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

// Petit composant consommateur pour exercer le contexte via le DOM,
// plutôt que de tester les hooks de manière isolée.
function TestConsumer() {
  const { user, loading, error, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.email : 'no-user'}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <button onClick={() => login('a@b.com', 'pw')}>login</button>
      <button onClick={() => register('Name', 'a@b.com', 'pw')}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  window.history.pushState({}, '', '/');
});

test('finishes loading with no user when there is no stored token', async () => {
  renderWithProvider();

  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );
  expect(screen.getByTestId('user')).toHaveTextContent('no-user');
});

test('login stores the token and sets the user on success', async () => {
  api.post.mockResolvedValueOnce({
    data: { token: 'tok123', user: { id: '1', email: 'a@b.com' } },
  });
  renderWithProvider();
  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );

  await act(async () => {
    await userEvent.click(screen.getByText('login'));
  });

  expect(screen.getByTestId('user')).toHaveTextContent('a@b.com');
  expect(localStorage.getItem('token')).toBe('tok123');
  expect(api.post).toHaveBeenCalledWith('/auth/login', {
    email: 'a@b.com',
    password: 'pw',
  });
});

test('login sets an error message and no user on failure', async () => {
  api.post.mockRejectedValueOnce({
    response: { data: { message: 'Bad credentials' } },
  });
  renderWithProvider();
  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );

  await act(async () => {
    await userEvent.click(screen.getByText('login'));
  });

  expect(screen.getByTestId('error')).toHaveTextContent('Bad credentials');
  expect(screen.getByTestId('user')).toHaveTextContent('no-user');
});

test('register stores the token and sets the user when the API returns one', async () => {
  api.post.mockResolvedValueOnce({
    data: { token: 'tok456', user: { id: '2', email: 'c@d.com' } },
  });
  renderWithProvider();
  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );

  await act(async () => {
    await userEvent.click(screen.getByText('register'));
  });

  expect(screen.getByTestId('user')).toHaveTextContent('c@d.com');
  expect(localStorage.getItem('token')).toBe('tok456');
});

test('register sets an error message on failure', async () => {
  api.post.mockRejectedValueOnce({
    response: { data: { message: 'Email already used' } },
  });
  renderWithProvider();
  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );

  await act(async () => {
    await userEvent.click(screen.getByText('register'));
  });

  expect(screen.getByTestId('error')).toHaveTextContent('Email already used');
});

test('logout clears the user and the stored token', async () => {
  api.post.mockResolvedValueOnce({
    data: { token: 'tok789', user: { id: '3', email: 'e@f.com' } },
  });
  renderWithProvider();
  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );
  await act(async () => {
    await userEvent.click(screen.getByText('login'));
  });

  await act(async () => {
    await userEvent.click(screen.getByText('logout'));
  });

  expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  expect(localStorage.getItem('token')).toBeNull();
});

test('reads a token from the URL on mount, decodes it and sets the user', async () => {
  const payload = { id: '9', email: 'urluser@example.com' };
  const base64Payload = btoa(JSON.stringify(payload));
  const token = `header.${base64Payload}.signature`;
  window.history.pushState({}, '', `/?token=${token}`);

  renderWithProvider();

  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );
  expect(screen.getByTestId('user')).toHaveTextContent('urluser@example.com');
  expect(localStorage.getItem('token')).toBe(token);
});

test('falls back to the token in localStorage when none is in the URL', async () => {
  const payload = { id: '10', email: 'stored@example.com' };
  const base64Payload = btoa(JSON.stringify(payload));
  const token = `header.${base64Payload}.signature`;
  localStorage.setItem('token', token);

  renderWithProvider();

  await waitFor(() =>
    expect(screen.getByTestId('loading')).toHaveTextContent('ready')
  );
  expect(screen.getByTestId('user')).toHaveTextContent('stored@example.com');
});
