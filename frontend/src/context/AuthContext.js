import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";
import { decodeJWT } from "../utils/jwt";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser({
          id: decoded.id,
          email: decoded.email,
          name: decoded.email.split('@')[0]
        });
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

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
