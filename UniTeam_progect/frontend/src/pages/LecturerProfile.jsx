import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

export default function LecturerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const lecturerProfile = user?.lecturerprofile || {};

  return (
    <div className="profile-wrapper">
      {/* Header Section */}
      <div className="profile-header surface">
        <div className="profile-header-content">
          <div>
            <h1 className="profile-title">My Lecturer Profile</h1>
            <p className="profile-subtitle">Your professional and academic information</p>
          </div>
          <Link to="/lecturer/profile/edit" className="btn btn-primary">
            <i className="fa-solid fa-pencil"></i> Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Left Column: Avatar and Contact */}
        <div className="profile-sidebar surface">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt="Profile Avatar" 
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              <span>{profile.first_name?.[0]?.toUpperCase() || 'L'}{profile.last_name?.[0]?.toUpperCase() || ''}</span>
            </div>
          )}
          
          <div className="profile-identity">
            <h2 className="profile-fullname">{profile.first_name} {profile.last_name}</h2>
            <p className="profile-username">@{profile.username}</p>
          </div>

          {/* Contact Information */}
          <div className="profile-contact-section">
            <div className="contact-item">
              <i className="fa-solid fa-envelope"></i>
              <div>
                <p className="contact-label">Email</p>
                <p className="contact-value">{profile.email}</p>
              </div>
            </div>

            {profile.phone_number && (
              <div className="contact-item">
                <i className="fa-solid fa-phone"></i>
                <div>
                  <p className="contact-label">Phone</p>
                  <p className="contact-value">{profile.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="profile-details">
          {/* Professional Information */}
          <div className="profile-section surface">
            <h3 className="section-title">Professional Information</h3>
            <div className="profile-info-grid">
              <div className="info-item full-width">
                <label className="info-label">Department</label>
                <p className="info-value">{lecturerProfile.department || '-'}</p>
              </div>
              <div className="info-item full-width">
                <label className="info-label">Office Location</label>
                <p className="info-value">{lecturerProfile.office_location || '-'}</p>
              </div>
            </div>
          </div>

          {/* Courses Taught */}
          <div className="profile-section surface">
            <h3 className="section-title">Courses Taught</h3>
            <div className="skills-container">
              {lecturerProfile.courses_taught && lecturerProfile.courses_taught.length > 0 ? (
                lecturerProfile.courses_taught.map((course, index) => (
                  <span key={index} className="skill-badge course-badge">
                    {course}
                  </span>
                ))
              ) : (
                <p className="empty-message">No courses listed</p>
              )}
            </div>
          </div>

          {/* Research Areas */}
          <div className="profile-section surface">
            <h3 className="section-title">Research Areas</h3>
            <div className="skills-container">
              {lecturerProfile.research_areas && lecturerProfile.research_areas.length > 0 ? (
                lecturerProfile.research_areas.map((area, index) => (
                  <span key={index} className="skill-badge research-badge">
                    {area}
                  </span>
                ))
              ) : (
                <p className="empty-message">No research areas listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
