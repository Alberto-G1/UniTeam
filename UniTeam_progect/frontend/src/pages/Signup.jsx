import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear specific error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validate passwords match
    if (formData.password !== formData.password2) {
      setErrors({ password: 'Passwords do not match' });
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
      <div className="auth-card">
        <h1>Join UniTeam</h1>
        <h2>Create Account</h2>
        
        {errors.non_field_errors && (
          <div className="alert alert-error">
            {errors.non_field_errors}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>
            
            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
            />
            {errors.phone_number && <span className="error">{errors.phone_number}</span>}
          </div>
          
          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="STUDENT">Student</option>
              <option value="LECTURER">Lecturer</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <span className="error">{errors.role}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
              />
              {errors.password2 && <span className="error">{errors.password2}</span>}
            </div>
          </div>
          
          {formData.role === 'LECTURER' && (
            <div className="alert alert-info">
              Note: Lecturer accounts require admin approval before you can log in.
            </div>
          )}
          
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};
