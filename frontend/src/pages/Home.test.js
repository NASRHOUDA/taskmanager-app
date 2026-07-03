import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com' },
    logout: mockLogout
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Home Page - Tests Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le message de bienvenue', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Authentification réussie/i)).toBeInTheDocument();
  });

  test('affiche le nom de l\'utilisateur', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  test('déconnecte l\'utilisateur et redirige', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText(/Se déconnecter/i));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
