import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    error: null,
    loading: false
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Page - Tests Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le formulaire d\'inscription', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min. 6 characters/i)).toBeInTheDocument();
  });

  test('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Repeat your password/i), { 
      target: { value: 'password456' } 
    });
    fireEvent.click(screen.getByText(/Create account →/i));
    
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('affiche une erreur si le mot de passe est trop court', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { 
      target: { value: '12345' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Repeat your password/i), { 
      target: { value: '12345' } 
    });
    fireEvent.click(screen.getByText(/Create account →/i));
    
    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('appelle register avec les bonnes données et réussit', async () => {
    mockRegister.mockResolvedValue(true);
    
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Jane Doe/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { 
      target: { value: 'john@test.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Repeat your password/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.click(screen.getByText(/Create account →/i));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@test.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('affiche une erreur si l\'inscription échoue', async () => {
    mockRegister.mockResolvedValue(false);
    
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    fireEvent.change(screen.getByPlaceholderText(/Jane Doe/i), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { 
      target: { value: 'john@test.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Min. 6 characters/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Repeat your password/i), { 
      target: { value: 'password123' } 
    });
    fireEvent.click(screen.getByText(/Create account →/i));
    
    expect(await screen.findByText(/Registration failed/i)).toBeInTheDocument();
  });

  test('affiche la force du mot de passe', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    const passwordInput = screen.getByPlaceholderText(/Min. 6 characters/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    expect(screen.getByText(/Very strong/i)).toBeInTheDocument();
  });
});
