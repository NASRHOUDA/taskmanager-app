import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';
import { decodeJWT } from '../utils/jwt';

jest.mock('axios');
jest.mock('../utils/jwt');

const mockAxios = axios.create();
mockAxios.post = jest.fn();

axios.create.mockReturnValue(mockAxios);

const TestComponent = () => {
  const { user, login, register, logout, error, loading } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => register('Test', 'test@test.com', 'password')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext - Tests Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAxios.post.mockReset();
    delete window.location;
    window.location = { search: '' };
  });

  test('login réussit avec des identifiants valides', async () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    const mockToken = 'valid.token';
    mockAxios.post.mockResolvedValue({ data: { token: mockToken, user: mockUser } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@test.com');
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  test('login échoue avec des identifiants invalides', async () => {
    mockAxios.post.mockRejectedValue({
      response: { data: { message: 'Bad credentials' } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Bad credentials');
  });

  test('login gère les erreurs sans message', async () => {
    mockAxios.post.mockRejectedValue({ response: {} });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Erreur de connexion');
  });

  test('register réussit avec des données valides', async () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    const mockToken = 'valid.token';
    mockAxios.post.mockResolvedValue({ data: { token: mockToken, user: mockUser } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@test.com');
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  test('register échoue avec un email déjà utilisé', async () => {
    mockAxios.post.mockRejectedValue({
      response: { data: { message: 'Email already used' } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Email already used');
  });

  test('register gère les erreurs sans message', async () => {
    mockAxios.post.mockRejectedValue({ response: {} });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent("Erreur d'inscription");
  });

  test('logout fonctionne correctement', async () => {
    localStorage.setItem('token', 'test-token');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('charge l\'utilisateur depuis localStorage', () => {
    const mockToken = 'valid.token';
    const mockUser = { id: '1', email: 'stored@test.com' };
    localStorage.setItem('token', mockToken);
    decodeJWT.mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('stored@test.com');
  });

  test('gère le token invalide dans localStorage', () => {
    localStorage.setItem('token', 'invalid.token');
    decodeJWT.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  test('login avec token dans l\'URL', async () => {
    const mockToken = 'url.token';
    const mockUser = { id: '2', email: 'urluser@test.com' };
    window.location.search = `?token=${mockToken}`;
    decodeJWT.mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(screen.getByTestId('user')).toHaveTextContent('urluser@test.com');
  });

  test('gère les erreurs réseau dans login', async () => {
    mockAxios.post.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Erreur de connexion');
  });

  test('gère les erreurs réseau dans register', async () => {
    mockAxios.post.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('error')).toHaveTextContent("Erreur d'inscription");
  });

  test('register sans token dans la réponse', async () => {
    mockAxios.post.mockResolvedValue({ data: { user: { id: '1' } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });
});
