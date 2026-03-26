// src/pages/admin/profile/AdminProfile.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Alert from '../../../components/Alert';
import './AdminProfile.css';

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
      <div className="admin-profile-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const adminProfile = user?.adminprofile || {};

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return profile.username?.[0]?.toUpperCase() || 'A';
  };

  return (
    <div className="admin-profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div>
            <h1>Admin Profile</h1>
            <p className="profile-subtitle">Manage your administrator account information</p>
          </div>
          <Link to="/admin/profile/edit" className="btn btn-primary">
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
            <span className="role-badge admin">
              <i className="fa-solid fa-shield-halved"></i>
              System Administrator
            </span>
          </div>

          <div className="profile-contact">
            <div className="contact-item">
              <i className="fa-solid fa-envelope"></i>
              <div>
                <p className="contact-label">Email Address</p>
                <p className="contact-value">{profile.email}</p>
              </div>
            </div>
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
              About
            </h3>
            <p className="detail-content">
              {adminProfile.bio || 'No bio provided. Click edit to add information about yourself.'}
            </p>
          </div>

          {/* Role Information */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-briefcase"></i>
              Role Information
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Role Title</label>
                <p>{adminProfile.role_title || 'System Administrator'}</p>
              </div>
              <div className="detail-item">
                <label>Access Level</label>
                <p>Full Administrator Access</p>
              </div>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-list-check"></i>
              Responsibilities
            </h3>
            <p className="detail-content">
              {adminProfile.responsibilities || 
                'Manage system users, oversee platform operations, ensure data security, and maintain system integrity.'}
            </p>
          </div>

          {/* System Info */}
          <div className="detail-card">
            <h3>
              <i className="fa-solid fa-server"></i>
              System Information
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Last Login</label>
                <p>{new Date(profile.last_login).toLocaleString()}</p>
              </div>
              <div className="detail-item">
                <label>User ID</label>
                <p className="mono">#{profile.id}</p>
              </div>
            </div>
          </div>

          {/* Alert for Security */}
          <Alert
            type="info"
            title="Security Notice"
            message="Your administrator account has full system access. Please ensure your credentials are kept secure."
          />
        </div>
      </div>
    </div>
  );
}