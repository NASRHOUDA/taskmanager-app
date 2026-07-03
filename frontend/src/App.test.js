import { render, screen } from '@testing-library/react';
import App from './App';

// Mock du contexte
jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({ user: null, loading: false })
}));

test('rend l\'application sans erreur', () => {
  render(<App />);
  expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
});
