// src/pages/auth/Signup.jsx - FULL SCREEN REDESIGN
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastContainer';
import './Auth.css';

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [theme, setTheme] = useState('light');
  
  const { register } = useAuth();
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

  const selectRole = (role) => {
    setFormData({ ...formData, role });
    if (errors.role) {
      setErrors({ ...errors, role: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    const result = await register(formData);
    
    if (result.success) {
      showToast('success', 'Account Created!', `Welcome to Project Hub, ${formData.first_name}!`);
      navigate('/');
    } else {
      showToast('error', 'Registration Failed', 'Could not create your account. Please try again.');
      setErrors({ submit: result.error });
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-fullscreen signup-fullscreen">
      <button className="theme-toggle-fullscreen" onClick={toggleTheme}>
        <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
      </button>

      <div className="auth-grid signup-grid">
        {/* Left Side - Brand Section */}
        <div className="auth-brand-section">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-large">
                <i className="fa-solid fa-rocket"></i>
              </div>
              <h1 className="brand-name">Join PROJECT HUB</h1>
              <p className="brand-tagline">Start your journey with us today</p>
            </div>
            
            <div className="brand-features">
              <div className="feature-card">
                <i className="fa-solid fa-infinity"></i>
                <h3>Free Forever</h3>
                <p>For students - no hidden costs</p>
              </div>
              <div className="feature-card">
                <i className="fa-solid fa-folder-open"></i>
                <h3>Unlimited Projects</h3>
                <p>Create and manage as many projects as you need</p>
              </div>
              <div className="feature-card">
                <i className="fa-solid fa-bolt"></i>
                <h3>Real-time Sync</h3>
                <p>Stay updated with instant notifications</p>
              </div>
            </div>

            <div className="brand-quote">
              <i className="fa-solid fa-quote-left"></i>
              <p>Project Hub transformed how our students collaborate on group projects. The intuitive interface and real-time features are game-changers.</p>
              <div className="quote-author">
                <strong>Dr. Sarah Johnson</strong>
                <span>Computer Science Department</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-form-container signup-form-container">
          <div className="form-wrapper signup-form-wrapper">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-full signup-form-full">
              {/* Role Selection */}
              <div className="input-group-full">
                <label>I am a</label>
                <div className="role-selection-full">
                  <div 
                    className={`role-card-full ${formData.role === 'STUDENT' ? 'selected' : ''}`}
                    onClick={() => selectRole('STUDENT')}
                  >
                    <i className="fa-solid fa-user-graduate"></i>
                    <span>Student</span>
                  </div>
                  <div 
                    className={`role-card-full ${formData.role === 'LECTURER' ? 'selected' : ''}`}
                    onClick={() => selectRole('LECTURER')}
                  >
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <span>Lecturer</span>
                  </div>
                </div>
                {errors.role && <span className="field-error">{errors.role}</span>}
              </div>

              {/* Two Column Layout for Name */}
              <div className="form-row-full">
                <div className="input-group-full">
                  <label htmlFor="first_name">First Name *</label>
                  <div className={`input-field-wrapper ${errors.first_name ? 'error' : ''}`}>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && <span className="field-error">{errors.first_name}</span>}
                </div>

                <div className="input-group-full">
                  <label htmlFor="last_name">Last Name *</label>
                  <div className={`input-field-wrapper ${errors.last_name ? 'error' : ''}`}>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.last_name && <span className="field-error">{errors.last_name}</span>}
                </div>
              </div>

              {/* Username */}
              <div className="input-group-full">
                <label htmlFor="username">Username *</label>
                <div className={`input-field-wrapper ${errors.username ? 'error' : ''}`}>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe123"
                  />
                </div>
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              {/* Email */}
              <div className="input-group-full">
                <label htmlFor="email">Email Address *</label>
                <div className={`input-field-wrapper ${errors.email ? 'error' : ''}`}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@university.edu"
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              {/* Phone Number */}
              <div className="input-group-full">
                <label htmlFor="phone_number">Phone Number (Optional)</label>
                <div className="input-field-wrapper">
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="form-row-full">
                <div className="input-group-full">
                  <label htmlFor="password">Password *</label>
                  <div className={`input-field-wrapper ${errors.password ? 'error' : ''}`}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
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
                  <div className="password-requirements">
                    <i className="fa-regular fa-circle-info"></i>
                    Must contain 8+ chars, uppercase, lowercase & numbers
                  </div>
                </div>

                <div className="input-group-full">
                  <label htmlFor="password2">Confirm Password *</label>
                  <div className={`input-field-wrapper ${errors.password2 ? 'error' : ''}`}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="password2"
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="toggle-password-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                  {errors.password2 && <span className="field-error">{errors.password2}</span>}
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="terms-group-full">
                <label className="checkbox-label-full">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                  <span>
                    I agree to the <Link to="/terms">Terms of Service</Link> and 
                    {' '}<Link to="/privacy">Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreeToTerms && <span className="field-error">{errors.agreeToTerms}</span>}
              </div>

              {/* Lecturer Notice */}
              {formData.role === 'LECTURER' && (
                <div className="info-alert-full">
                  <i className="fa-solid fa-circle-info"></i>
                  <div>
                    <strong>Admin approval required</strong>
                    <p>Lecturer accounts need to be approved by an administrator before you can log in.</p>
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn-full" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Already have an account? <Link to="/login">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};