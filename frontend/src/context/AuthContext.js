import React, { createContext, useState, useContext } from "react";
import api from "../services/api";
import { decodeJWT } from "../utils/jwt";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Extraction et sauvegarde du token AVANT le premier rendu (synchrone),
// pour éviter la race condition avec la redirection /home -> /dashboard
// (les effects des enfants s'exécutent avant ceux des parents).
const extractAndStoreToken = () => {
  const params = new URLSearchParams(window.location.search);
  let token = params.get("token");
  if (!token) {
    token = localStorage.getItem("token");
  }
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const decoded = decodeJWT(token);
    if (decoded) {
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.email.split('@')[0],
        provider: decoded.provider
      };
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => extractAndStoreToken());
  const [loading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "Erreur de connexion");
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);
      const response = await api.post("/auth/register", { name, email, password });
      if (response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(user);
      }
      return true;
    } catch (error) {
      console.error("Register error:", error);
      setError(error.response?.data?.message || "Erreur d'inscription");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
