import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Auth.css';

export const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'STUDENT',
    phone_number: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const { register } = useAuth();
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
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const selectRole = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (formData.password !== formData.password2) {
      setErrors({ password: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setErrors({ agreeToTerms: 'You must agree to the Terms of Service' });
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setErrors(result.error);
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
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Welcome to PROJECT HUB</h2>
          <p style={{ fontSize: '1rem', opacity: 0.9, maxWidth: '320px' }}>Your ultimate destination for managing and tracking all your projects in one place.</p>
        </div>

        <div className="auth-form-panel">
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join PROJECT HUB to manage your projects</p>
          
          {errors.non_field_errors && (
            <div className="alert alert-error">
              {errors.non_field_errors}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{display: 'block', marginBottom: '0.75rem', fontWeight: 600}}>Select Your Role</label>
              <div className="role-selection">
                <div 
                  className={`role-card ${formData.role === 'STUDENT' ? 'selected' : ''}`}
                  onClick={() => selectRole('STUDENT')}
                >
                  <i className="fas fa-user-graduate role-card-icon"></i>
                  <span className="role-card-label">Student</span>
                </div>
                <div 
                  className={`role-card ${formData.role === 'LECTURER' ? 'selected' : ''}`}
                  onClick={() => selectRole('LECTURER')}
                >
                  <i className="fas fa-chalkboard-teacher role-card-icon"></i>
                  <span className="role-card-label">Lecturer</span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    name="first_name"
                    className="input-field"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                  />
                </div>
                {errors.first_name && <span className="error">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    name="last_name"
                    className="input-field"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                  />
                </div>
                {errors.last_name && <span className="error">{errors.last_name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <i className="fas fa-at"></i>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
              {errors.username && <span className="error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your university email"
                  required
                />
              </div>
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <div className="input-with-icon">
                <i className="fas fa-phone"></i>
                <input
                  type="tel"
                  name="phone_number"
                  className="input-field"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Your phone number"
                />
              </div>
              {errors.phone_number && <span className="error">{errors.phone_number}</span>}
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
                  placeholder="Create a password"
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
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword2 ? 'text' : 'password'}
                  name="password2"
                  className="input-field"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword2(!showPassword2)}
                  aria-label="Toggle password"
                >
                  <i className={showPassword2 ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
              {errors.password2 && <span className="error">{errors.password2}</span>}
            </div>

            {formData.role === 'LECTURER' && (
              <div className="alert alert-info" style={{fontSize: '0.9rem', padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--light-gray)', borderLeft: '4px solid var(--accent-2)', borderRadius: '4px'}}>
                <i className="fas fa-info-circle"></i> Lecturer accounts require admin approval before you can log in.
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
                I agree to the <Link to="/terms" className="terms-link">Terms of Service</Link>
              </label>
              {errors.agreeToTerms && <span className="error">{errors.agreeToTerms}</span>}
            </div>
            
            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
