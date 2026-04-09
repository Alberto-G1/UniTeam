// src/pages/auth/ForgotPassword.jsx - FULL SCREEN REDESIGN
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/ToastContainer';
import './Auth.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('light');
  const { showToast } = useToast();

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

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;
    
    setLoading(true);
    setError('');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitted(true);
      showToast('success', 'Reset Link Sent', 'Check your email for password reset instructions');
    } catch (err) {
      setError('Email not found or server error. Please try again.');
      showToast('error', 'Error', 'Could not send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen forgot-fullscreen">
      <button className="theme-toggle-fullscreen" onClick={toggleTheme}>
        <i className={theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'}></i>
      </button>

      <div className="auth-grid forgot-grid">
        {/* Left Side - Brand Section */}
        <div className="auth-brand-section">
          <div className="brand-content">
            <div className="brand-logo">
              <div className="logo-icon-large">
                <i className="fa-solid fa-key"></i>
              </div>
              <h1 className="brand-name">Reset Password</h1>
              <p className="brand-tagline">We'll help you get back into your account</p>
            </div>
            
            <div className="reset-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Enter your email</h4>
                  <p>Provide the email address associated with your account</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Check your inbox</h4>
                  <p>We'll send you a password reset link</p>
                </div>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Create new password</h4>
                  <p>Follow the link to set up a new password</p>
                </div>
              </div>
            </div>

            <div className="security-note">
              <i className="fa-solid fa-shield-halved"></i>
              <p>Your account security is our priority. The reset link expires in 24 hours.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-form-container forgot-form-container">
          <div className="form-wrapper forgot-form-wrapper">
            {!submitted ? (
              <>
                <div className="form-header">
                  <h2>Forgot Password?</h2>
                  <p>Enter your email to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form-full">
                  <div className="input-group-full">
                    <label htmlFor="email">
                      <i className="fa-regular fa-envelope"></i>
                      Email Address
                    </label>
                    <div className={`input-field-wrapper ${error ? 'error' : ''}`}>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your registered email"
                        autoFocus
                      />
                    </div>
                    {error && <span className="field-error">{error}</span>}
                  </div>

                  <button type="submit" className="submit-btn-full" disabled={loading}>
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        Send Reset Link
                      </>
                    )}
                  </button>

                  <div className="back-link-full">
                    <Link to="/login">
                      <i className="fa-solid fa-arrow-left"></i>
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <div className="success-state">
                <div className="success-icon-large">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <h2>Check Your Email</h2>
                <p>
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <div className="success-actions">
                  <button 
                    onClick={() => setSubmitted(false)} 
                    className="text-link-btn"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    Send again
                  </button>
                  <Link to="/login" className="btn-primary-full">
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Login
                  </Link>
                </div>
                <div className="email-tips">
                  <p><i className="fa-regular fa-envelope"></i> Didn't receive the email?</p>
                  <ul>
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="form-footer">
              <p>
                Remember your password? <Link to="/login">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};