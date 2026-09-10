import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to get auth headers (Cookie is sent automatically with credentials: 'include',
  // and we also send Authorization header if token is stored in localStorage)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Verify session on initial mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/me`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
          setIsAuthenticated(true);
        } else {
          setAdmin(null);
          setIsAuthenticated(false);
          localStorage.removeItem('admin_token');
        }
      } catch (err) {
        console.warn('[AdminAuth] Session check failed:', err.message);
        setAdmin(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid administrator credentials.');
    }

    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }

    setAdmin(data.admin);
    setIsAuthenticated(true);
    return data;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[AdminAuth] Logout request error:', err.message);
    } finally {
      localStorage.removeItem('admin_token');
      setAdmin(null);
      setIsAuthenticated(false);
    }
  };

  const updateAdmin = (partialOrFullAdmin) => {
    setAdmin((prev) => (prev ? { ...prev, ...partialOrFullAdmin } : partialOrFullAdmin));
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated,
        loading,
        login,
        logout,
        updateAdmin,
        getAuthHeaders,
        API_BASE,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
