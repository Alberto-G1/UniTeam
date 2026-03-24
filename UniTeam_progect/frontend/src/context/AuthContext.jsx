import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:8000';

// Helper to normalize user data with full avatar URL
const normalizeUser = (userData) => {
  if (!userData) return null;
  
  return {
    ...userData,
    avatar: userData.avatar && !userData.avatar.startsWith('http') 
      ? `${API_BASE_URL}${userData.avatar}`
      : userData.avatar
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(normalizeUser(userData));
        } catch (error) {
          console.error('Failed to get current user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      const normalizedUser = normalizeUser(data.user);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      setUser(normalizedUser);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      
      // Store tokens and user data
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      const normalizedUser = normalizeUser(data.user);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      setUser(normalizedUser);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isStudent: user?.role === 'STUDENT',
    isLecturer: user?.role === 'LECTURER',
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
