import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/Profile.css';

export default function AdminProfile() {
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

  const adminProfile = user?.adminprofile || {};

  return (
    <div className="profile-wrapper">
      {/* Header Section */}
      <div className="profile-header surface">
        <div className="profile-header-content">
          <div>
            <h1 className="profile-title">My Admin Profile</h1>
            <p className="profile-subtitle">Your system administrator account information</p>
          </div>
          <Link to="/admin/profile/edit" className="btn btn-primary">
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
              <span>{profile.first_name?.[0]?.toUpperCase() || 'A'}{profile.last_name?.[0]?.toUpperCase() || ''}</span>
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
          {/* Role Information */}
          <div className="profile-section surface">
            <h3 className="section-title">Role Information</h3>
            <div className="profile-info-grid">
              <div className="info-item full-width">
                <label className="info-label">Role Title</label>
                <p className="info-value">{adminProfile.role_title || '-'}</p>
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="profile-section surface">
            <h3 className="section-title">Responsibilities & Notes</h3>
            <p className="section-content responsibilities-text">
              {adminProfile.responsibilities || 'No notes provided.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
