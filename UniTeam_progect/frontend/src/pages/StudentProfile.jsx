import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

export default function StudentProfile() {
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

  const studentProfile = user?.studentprofile || {};

  return (
    <div className="profile-wrapper">
      {/* Header Section */}
      <div className="profile-header surface">
        <div className="profile-header-content">
          <div>
            <h1 className="profile-title">My Student Profile</h1>
            <p className="profile-subtitle">Your personal and academic information</p>
          </div>
          <Link to="/student/profile/edit" className="btn btn-primary">
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
              <span>{profile.first_name?.[0]?.toUpperCase() || 'S'}{profile.last_name?.[0]?.toUpperCase() || ''}</span>
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
                <p className="contact-label">School Email</p>
                <p className="contact-value">{profile.email}</p>
              </div>
            </div>

            {studentProfile.personal_email && (
              <div className="contact-item">
                <i className="fa-solid fa-envelope-open-text"></i>
                <div>
                  <p className="contact-label">Personal Email</p>
                  <p className="contact-value">{studentProfile.personal_email}</p>
                </div>
              </div>
            )}

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
          {/* About Me */}
          <div className="profile-section surface">
            <h3 className="section-title">About Me</h3>
            <p className="section-content">
              {studentProfile.bio || 'No bio provided.'}
            </p>
          </div>

          {/* Academic Information */}
          <div className="profile-section surface">
            <h3 className="section-title">Academic Information</h3>
            <div className="profile-info-grid">
              <div className="info-item">
                <label className="info-label">University</label>
                <p className="info-value">{studentProfile.university || '-'}</p>
              </div>
              <div className="info-item">
                <label className="info-label">Department</label>
                <p className="info-value">{studentProfile.department || '-'}</p>
              </div>
              <div className="info-item">
                <label className="info-label">Course</label>
                <p className="info-value">{studentProfile.course_name || '-'}</p>
              </div>
              <div className="info-item">
                <label className="info-label">Year of Study</label>
                <p className="info-value">{studentProfile.year_of_study || '-'}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="profile-section surface">
            <h3 className="section-title">Skills</h3>
            <div className="skills-container">
              {studentProfile.skills && studentProfile.skills.length > 0 ? (
                studentProfile.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="empty-message">No skills listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
