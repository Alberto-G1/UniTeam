// src/pages/student/profile/StudentProfileEdit.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ToastContainer';
import Alert from '../../../components/Alert';
import TagsInput from '../../../components/TagsInput';
import './StudentProfileEdit.css';

export default function StudentProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [skillsList, setSkillsList] = useState([]);
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

  useEffect(() => {
    if (user) {
      const profile = user.studentprofile || {};
      const skills = profile.skills || [];
      setSkillsList(skills);
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
        skills: skills.join(', ')
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

  const handleSkillsChange = (skills) => {
    setSkillsList(skills);
    setFormData(prev => ({
      ...prev,
      skills: skills.join(', ')
    }));
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
      // TODO: Implement API call to update student profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('success', 'Profile Updated', 'Your profile has been updated successfully.');
      navigate('/student/profile');
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
    return user?.username?.[0]?.toUpperCase() || 'S';
  };

  return (
    <div className="student-profile-edit-page">
      {/* Header */}
      <div className="edit-header">
        <div className="edit-header-content">
          <div>
            <h1>Edit Profile</h1>
            <p className="edit-subtitle">Update your personal and academic information</p>
          </div>
          <Link to="/student/profile" className="btn-secondary">
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
            
            <label htmlFor="avatar-input" className="btn-outline avatar-btn">
              <i className="fa-solid fa-camera"></i>
              Change Photo
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
                  School Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="student@university.edu"
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

              <div className="form-group">
                <label htmlFor="personal_email">Personal Email</label>
                <input
                  type="email"
                  id="personal_email"
                  name="personal_email"
                  value={formData.personal_email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="personal@example.com"
                />
                <div className="form-hint">Optional: Used for communication outside the university</div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  rows="4"
                  placeholder="Tell us about yourself, your interests, and goals..."
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h3>Academic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="university">University</label>
                  <input
                    type="text"
                    id="university"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Your university name"
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
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="course_name">Course/Program</label>
                  <input
                    type="text"
                    id="course_name"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., BSc Computer Science"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year_of_study">Year of Study</label>
                  <select
                    id="year_of_study"
                    name="year_of_study"
                    value={formData.year_of_study}
                    onChange={handleChange}
                    className="form-select"
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
                <label htmlFor="skills">Skills</label>
                <TagsInput
                  tags={skillsList}
                  onChange={handleSkillsChange}
                  placeholder="Add your skills (e.g., Python, JavaScript, React)"
                />
                <div className="form-hint">Press Enter to add a skill</div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
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
              <Link to="/student/profile" className="btn-secondary">
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