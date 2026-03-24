import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
      </button>

      <div className="auth-shell surface">
        <div className="auth-hero-panel hero-image">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Welcome Back!</h2>
          <p style={{ fontSize: '1rem', opacity: 0.9, maxWidth: '320px' }}>Log in to access your projects and continue where you left off.</p>
        </div>

        <div className="auth-form-panel">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Please sign in to your account</p>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <div className="input-with-icon">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Administrator"
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <div className="checkbox-row">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="remember-checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
