// src/pages/auth/Login.jsx - FULL SCREEN REDESIGN
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import './Auth.css';

export const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const { login } = useAuth();
  const { showToast } = useToast();
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
    showToast('info', 'Theme Changed', `${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Email or username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      showToast('success', 'Welcome back!', 'You have successfully logged in.');
      navigate('/');
    } else {
      showToast('error', 'Login Failed', result.error || 'Invalid credentials. Please try again.');
      setErrors({ submit: result.error });
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-fullscreen">
      <button className="theme-toggle-fullscreen" onClick={toggleTheme}>
        <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
      </button>

      <div className="auth-grid">
        {/* Left Side - Brand Section */}
        <div className="auth-brand-section">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-large">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h1 className="brand-name">PROJECT HUB</h1>
              <p className="brand-tagline">University Project Management System</p>
            </div>
            
            <div className="brand-features">
              <div className="feature-card">
                <i className="fa-solid fa-diagram-project"></i>
                <h3>Project Management</h3>
                <p>Organize and track your academic projects efficiently</p>
              </div>
              <div className="feature-card">
                <i className="fa-solid fa-users"></i>
                <h3>Team Collaboration</h3>
                <p>Work seamlessly with your team members</p>
              </div>
              <div className="feature-card">
                <i className="fa-solid fa-chart-line"></i>
                <h3>Progress Tracking</h3>
                <p>Monitor milestones and deadlines in real-time</p>
              </div>
            </div>

            <div className="brand-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Active Projects</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">2,000+</span>
                <span className="stat-label">Happy Students</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Universities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-full">
              <div className="input-group-full">
                <label htmlFor="username">
                  <i className="fa-regular fa-envelope"></i>
                  Email or Username
                </label>
                <div className={`input-field-wrapper ${errors.username ? 'error' : ''}`}>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your email or username"
                    autoFocus
                  />
                </div>
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              <div className="input-group-full">
                <label htmlFor="password">
                  <i className="fa-solid fa-lock"></i>
                  Password
                </label>
                <div className={`input-field-wrapper ${errors.password ? 'error' : ''}`}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="toggle-password-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-options-full">
                <label className="checkbox-label-full">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link-full">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="submit-btn-full" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-arrow-right-to-bracket"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Don't have an account? <Link to="/signup">Create an account</Link>
              </p>
            </div>

            <div className="demo-section">
              <div className="demo-divider">
                <span>Quick Demo Access</span>
              </div>
              <div className="demo-buttons">
                <button 
                  className="demo-btn-full admin"
                  onClick={() => {
                    setFormData({ ...formData, username: 'admin@projecthub.com', password: 'admin123' });
                    showToast('info', 'Demo Credentials', 'Admin credentials loaded');
                  }}
                >
                  <i className="fa-solid fa-shield-halved"></i>
                  Admin Demo
                </button>
                <button 
                  className="demo-btn-full student"
                  onClick={() => {
                    setFormData({ ...formData, username: 'student@university.edu', password: 'student123' });
                    showToast('info', 'Demo Credentials', 'Student credentials loaded');
                  }}
                >
                  <i className="fa-solid fa-user-graduate"></i>
                  Student Demo
                </button>
                <button 
                  className="demo-btn-full lecturer"
                  onClick={() => {
                    setFormData({ ...formData, username: 'lecturer@university.edu', password: 'lecturer123' });
                    showToast('info', 'Demo Credentials', 'Lecturer credentials loaded');
                  }}
                >
                  <i className="fa-solid fa-chalkboard-user"></i>
                  Lecturer Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};