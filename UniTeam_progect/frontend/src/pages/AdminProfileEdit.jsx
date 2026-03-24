import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfileEdit.css';

export default function AdminProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    avatar: null,
    role_title: '',
    responsibilities: ''
  });
  const [preview, setPreview] = useState(null);

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
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement API call to update admin profile
      // For now, just show success message
      setTimeout(() => {
        alert('Profile updated successfully!');
        navigate('/admin/profile');
      }, 500);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit-wrapper">
      {/* Header Section */}
      <div className="profile-edit-header surface">
        <div className="profile-edit-header-content">
          <div>
            <h1 className="profile-edit-title">Edit Admin Profile</h1>
            <p className="profile-edit-subtitle">Make changes to your profile and click "Save Changes" when you're done</p>
          </div>
          <Link to="/admin/profile" className="btn btn-secondary">
            <i className="fa-solid fa-arrow-left"></i> Back to Profile
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="profile-edit-grid">
          {/* Left Column: Avatar */}
          <div className="profile-edit-sidebar surface">
            {preview ? (
              <img 
                src={preview} 
                alt="Avatar Preview" 
                className="profile-edit-avatar"
              />
            ) : (
              <div className="profile-edit-avatar-placeholder">
                <i className="fa-solid fa-image"></i>
              </div>
            )}
            
            <label htmlFor="avatar-input" className="btn btn-primary avatar-btn">
              <i className="fa-solid fa-camera"></i> Change Picture
            </label>
            <input
              id="avatar-input"
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Right Column: Form Fields */}
          <div className="profile-edit-details surface">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  disabled
                />
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

            {/* Admin Information */}
            <div className="form-section">
              <h3 className="form-section-title">Role Information</h3>
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
                  className="form-input"
                  rows="6"
                  placeholder="Describe your responsibilities and any additional notes..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link to="/admin/profile" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
