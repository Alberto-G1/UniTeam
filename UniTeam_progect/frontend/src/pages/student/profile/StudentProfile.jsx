// src/pages/student/profile/StudentProfile.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Alert from '../../../components/Alert';
import './StudentProfile.css';

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
      <div className="student-profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const studentProfile = user?.studentprofile || {};

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return profile.username?.[0]?.toUpperCase() || 'S';
  };

  return (
    <div className="student-profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div>
            <h1>My Profile</h1>
            <p className="profile-subtitle">Manage your personal and academic information</p>
          </div>
          <Link to="/student/profile/edit" className="btn-primary">
            <i className="fa-solid fa-pencil"></i>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="profile-grid">
        {/* Left Column - Avatar & Basic Info */}
        <div className="profile-sidebar-card">
          <div className="avatar-container">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.first_name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {getInitials()}
              </div>
            )}
            <div className="avatar-status online"></div>
          </div>
          
          <div className="profile-identity">
            <h2>{profile.first_name} {profile.last_name}</h2>
            <p className="profile-username">@{profile.username}</p>
            <span className="role-badge student">
              <i className="fa-solid fa-user-graduate"></i>
              Student
            </span>
          </div>

          <div className="profile-contact">
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
                  <p className="contact-label">Phone Number</p>
                  <p className="contact-value">{profile.phone_number}</p>
                </div>
              </div>
            )}
            <div className="contact-item">
              <i className="fa-solid fa-calendar"></i>
              <div>
                <p className="contact-label">Member Since</p>
                <p className="contact-value">
                  {new Date(profile.date_joined).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="profile-details">
          {/* About Section */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-circle-info"></i>
              About Me
            </h3>
            <p className="detail-content">
              {studentProfile.bio || 'No bio provided. Click edit to add information about yourself.'}
            </p>
          </div>

          {/* Academic Information */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-graduation-cap"></i>
              Academic Information
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>University</label>
                <p>{studentProfile.university || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <label>Department</label>
                <p>{studentProfile.department || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <label>Course</label>
                <p>{studentProfile.course_name || 'Not specified'}</p>
              </div>
              <div className="detail-item">
                <label>Year of Study</label>
                <p>{studentProfile.year_of_study || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-code"></i>
              Skills & Expertise
            </h3>
            <div className="skills-container">
              {studentProfile.skills && studentProfile.skills.length > 0 ? (
                studentProfile.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="empty-text">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="detail-card stats-overview">
            <h3>
              <i className="fa-solid fa-chart-simple"></i>
              Academic Overview
            </h3>
            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-number">8</span>
                <span className="stat-label">Active Projects</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">12</span>
                <span className="stat-label">Completed Tasks</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">5</span>
                <span className="stat-label">Team Members</span>
              </div>
            </div>
          </div>

          {/* Alert for incomplete profile */}
          {!studentProfile.bio && !studentProfile.skills?.length && (
            <Alert
              type="warning"
              title="Complete Your Profile"
              message="Adding a bio and skills helps your team members know you better."
            />
          )}
        </div>
      </div>
    </div>
  );
}