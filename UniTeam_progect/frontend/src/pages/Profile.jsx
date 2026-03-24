import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function Profile() {
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

  const getProfileData = () => {
    if (user.role === 'STUDENT') {
      return user.studentprofile || {};
    } else if (user.role === 'LECTURER') {
      return user.lecturerprofile || {};
    } else if (user.role === 'ADMIN') {
      return user.adminprofile || {};
    }
    return {};
  };

  const profileData = getProfileData();

  return (
    <div className="profile-container">
      <div className="profile-header-section surface">
        <div className="profile-header-content">
          <div>
            <h1>My Profile</h1>
            <p>Your personal and academic information</p>
          </div>
          <Link to="/student/profile/edit" className="btn btn-primary">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt="Profile Avatar" 
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {profile.first_name?.[0]?.toUpperCase() || 'U'}
              {profile.last_name?.[0]?.toUpperCase() || ''}
            </div>
          )}
          <h2 className="profile-name">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="profile-username">@{profile.username}</p>

          <div className="profile-contact">
            <div className="contact-item">
              <span className="contact-icon"><i className="fa-solid fa-envelope"></i></span>
              <div>
                <p className="contact-label">School Email</p>
                <p className="contact-value">{profile.email}</p>
              </div>
            </div>
            {profileData.personal_email && (
              <div className="contact-item">
                <span className="contact-icon"><i className="fa-solid fa-envelope-open"></i></span>
                <div>
                  <p className="contact-label">Personal Email</p>
                  <p className="contact-value">{profileData.personal_email}</p>
                </div>
              </div>
            )}
            {profile.phone_number && (
              <div className="contact-item">
                <span className="contact-icon"><i className="fa-solid fa-phone"></i></span>
                <div>
                  <p className="contact-label">Phone</p>
                  <p className="contact-value">{profile.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-section surface">
            <h3>About Me</h3>
            <p className="profile-bio">
              {profileData.bio || 'No bio provided.'}
            </p>
          </div>

          {user.role === 'STUDENT' && (
            <>
              <div className="profile-section surface">
                <h3>Academic Information</h3>
                <dl className="profile-dl">
                  <dt>University</dt>
                  <dd>{profileData.university || '-'}</dd>
                  <dt>Department</dt>
                  <dd>{profileData.department || '-'}</dd>
                  <dt>Course</dt>
                  <dd>{profileData.course_name || '-'}</dd>
                  <dt>Year of Study</dt>
                  <dd>{profileData.year_of_study || '-'}</dd>
                </dl>
              </div>

              <div className="profile-section surface">
                <h3>Skills</h3>
                <div className="skills-list">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="empty-text">No skills listed</p>
                  )}
                </div>
              </div>
            </>
          )}

          {user.role === 'LECTURER' && (
            <>
              <div className="profile-section surface">
                <h3>Courses Taught</h3>
                <div className="skills-list">
                  {profileData.courses_taught && profileData.courses_taught.length > 0 ? (
                    profileData.courses_taught.map((course, index) => (
                      <span key={index} className="skill-tag">
                        {course}
                      </span>
                    ))
                  ) : (
                    <p className="empty-text">No courses listed</p>
                  )}
                </div>
              </div>

              <div className="profile-section surface">
                <h3>Research Areas</h3>
                <div className="skills-list">
                  {profileData.research_areas && profileData.research_areas.length > 0 ? (
                    profileData.research_areas.map((area, index) => (
                      <span key={index} className="skill-tag">
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="empty-text">No research areas listed</p>
                  )}
                </div>
              </div>
            </>
          )}

          {user.role === 'ADMIN' && (
            <div className="profile-section surface">
              <h3>Admin Information</h3>
              <dl className="profile-dl">
                <dt>Role Title</dt>
                <dd>{profileData.role_title || '-'}</dd>
                <dt>Responsibilities</dt>
                <dd>{profileData.responsibilities || '-'}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
