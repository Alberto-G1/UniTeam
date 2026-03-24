import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfileEdit.css';

export default function StudentProfileEdit() {
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
    personal_email: '',
    university: '',
    department: '',
    course_name: '',
    year_of_study: '',
    bio: '',
    skills: ''
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      const profile = user.studentprofile || {};
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        avatar: null,
        personal_email: profile.personal_email || '',
        university: profile.university || '',
        department: profile.department || '',
        course_name: profile.course_name || '',
        year_of_study: profile.year_of_study || '',
        bio: profile.bio || '',
        skills: profile.skills ? profile.skills.join(', ') : ''
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
      // TODO: Implement API call to update profile
      // For now, just show success message
      setTimeout(() => {
        alert('Profile updated successfully!');
        navigate('/student/profile');
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
            <h1 className="profile-edit-title">Edit Student Profile</h1>
            <p className="profile-edit-subtitle">Make changes to your profile and click "Save Changes" when you're done</p>
          </div>
          <Link to="/student/profile" className="btn btn-secondary">
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
                <label htmlFor="email">School Email</label>
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

            {/* Personal Information */}
            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>
              <div className="form-group">
                <label htmlFor="personal_email">Personal Email</label>
                <input
                  type="email"
                  id="personal_email"
                  name="personal_email"
                  value={formData.personal_email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-input"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Academic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="university">University</label>
                  <input
                    type="text"
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="course_name">Course</label>
                  <input
                    type="text"
                    id="course_name"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year_of_study">Year of Study</label>
                  <select
                    id="year_of_study"
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills (comma-separated)</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Python, JavaScript, React"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link to="/student/profile" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
