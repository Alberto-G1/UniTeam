// src/pages/admin/profile/AdminProfileEdit.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ToastContainer';
import Alert from '../../../components/Alert';
import './AdminProfileEdit.css';

export default function AdminProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    avatar: null,
    role_title: '',
    responsibilities: ''
  });

  useEffect(() => {
    if (user) {
      const profile = user.adminprofile || {};
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        avatar: null,
        role_title: profile.role_title || '',
        responsibilities: profile.responsibilities || ''
      });
      if (user.avatar) {
        setPreview(user.avatar);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'File size must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ avatar: 'File must be an image' });
        return;
      }
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // TODO: Implement API call to update admin profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('success', 'Profile Updated', 'Your profile has been updated successfully.');
      navigate('/admin/profile');
    } catch (err) {
      showToast('error', 'Update Failed', 'Could not update your profile. Please try again.');
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`;
    }
    return user?.username?.[0]?.toUpperCase() || 'A';
  };

  return (
    <div className="admin-profile-edit-container">
      {/* Header */}
      <div className="edit-header">
        <div className="edit-header-content">
          <div>
            <h1>Edit Admin Profile</h1>
            <p className="edit-subtitle">Update your administrator account information</p>
          </div>
          <Link to="/admin/profile" className="btn btn-secondary">
            <i className="fa-solid fa-arrow-left"></i>
            Back to Profile
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-grid">
          {/* Left Column - Avatar */}
          <div className="avatar-section">
            <div className="avatar-preview">
              {preview ? (
                <img src={preview} alt="Preview" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials()}
                </div>
              )}
            </div>
            
            <label htmlFor="avatar-input" className="btn btn-outline avatar-btn">
              <i className="fa-solid fa-camera"></i>
              Change Avatar
            </label>
            <input
              id="avatar-input"
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            {errors.avatar && (
              <span className="error-message">{errors.avatar}</span>
            )}
            <p className="avatar-hint">
              <i className="fa-regular fa-circle-info"></i>
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>

          {/* Right Column - Form Fields */}
          <div className="form-fields">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`form-input ${errors.first_name ? 'error' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && (
                    <div className="field-error">{errors.first_name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`form-input ${errors.last_name ? 'error' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && (
                    <div className="field-error">{errors.last_name}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="admin@university.edu"
                  disabled
                />
                {errors.email && (
                  <div className="field-error">{errors.email}</div>
                )}
                <div className="form-hint">Email cannot be changed. Contact support if you need to update it.</div>
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number</label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Role Information */}
            <div className="form-section">
              <h3>Role Information</h3>
              <div className="form-group">
                <label htmlFor="role_title">Role Title</label>
                <input
                  type="text"
                  id="role_title"
                  name="role_title"
                  value={formData.role_title}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., System Administrator, Database Manager"
                />
              </div>

              <div className="form-group">
                <label htmlFor="responsibilities">Responsibilities & Notes</label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  rows="5"
                  placeholder="Describe your responsibilities and any additional notes..."
                />
                <div className="form-hint">This information is only visible to other administrators.</div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save Changes
                  </>
                )}
              </button>
              <Link to="/admin/profile" className="btn btn-secondary">
                Cancel
              </Link>
            </div>

            {errors.submit && (
              <Alert type="error" title="Error" message={errors.submit} />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}