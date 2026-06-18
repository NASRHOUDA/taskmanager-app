import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: '#4CAF50' }}>✅ Authentification réussie !</h1>
        <p style={{ fontSize: '18px', margin: '20px 0' }}>
          Bienvenue, <strong>{user?.name || user?.email || 'Utilisateur'}</strong> !
        </p>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Vous êtes maintenant connecté avec succès.
        </p>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#cc0000'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ff4444'}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default Home;
