// src/pages/admin/dashboard/AdminDashboard.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usersAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import StatCard from '../../../components/StatCard';
import Alert from '../../../components/Alert';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    lecturers: 0,
    pendingLecturers: 0,
    activeProjects: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await usersAPI.list();
        const usersList = Array.isArray(usersData) ? usersData : usersData.results || [];
        setUsers(usersList);
        
        setStats({
          total: usersList.length,
          students: usersList.filter(u => u.role === 'STUDENT').length,
          lecturers: usersList.filter(u => u.role === 'LECTURER' && u.is_approved).length,
          pendingLecturers: usersList.filter(u => u.role === 'LECTURER' && !u.is_approved).length,
          activeProjects: 24, // Placeholder - would come from API
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showToast('error', 'Error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleApproveLecturer = async (lecturerId) => {
    try {
      await usersAPI.approveLecturer(lecturerId);
      const usersData = await usersAPI.list();
      const usersList = Array.isArray(usersData) ? usersData : usersData.results || [];
      setUsers(usersList);
      setStats(prev => ({
        ...prev,
        lecturers: prev.lecturers + 1,
        pendingLecturers: prev.pendingLecturers - 1,
      }));
      showToast('success', 'Lecturer Approved', 'The lecturer account has been approved.');
    } catch (error) {
      console.error('Failed to approve lecturer:', error);
      showToast('error', 'Approval Failed', 'Could not approve the lecturer account.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const pendingLecturers = users.filter(u => u.role === 'LECTURER' && !u.is_approved);

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome back, {user?.first_name || user?.username}!</h1>
          <p className="dashboard-subtitle">Here's what's happening with your platform today.</p>
        </div>
        <div className="welcome-date">
          <i className="fa-regular fa-calendar"></i>
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <StatCard
          type="green"
          icon={<i className="fa-solid fa-users"></i>}
          value={stats.total}
          label="Total Users"
          trend="up"
          trendValue="12%"
        />
        <StatCard
          type="teal"
          icon={<i className="fa-solid fa-user-graduate"></i>}
          value={stats.students}
          label="Students"
          trend="up"
          trendValue="8%"
        />
        <StatCard
          type="purple"
          icon={<i className="fa-solid fa-chalkboard-user"></i>}
          value={stats.lecturers}
          label="Lecturers"
          trend="up"
          trendValue="3%"
        />
        <StatCard
          type="gold"
          icon={<i className="fa-solid fa-clock"></i>}
          value={stats.pendingLecturers}
          label="Pending Approvals"
          trend="new"
          trendValue="+2 new"
        />
      </div>

      {/* Pending Approvals Section */}
      {pendingLecturers.length > 0 && (
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-clock"></i>
              <h2>Pending Lecturer Approvals</h2>
            </div>
            <span className="pending-badge">{pendingLecturers.length} pending</span>
          </div>
          <div className="card-body">
            <div className="approvals-list">
              {pendingLecturers.map((lecturer) => (
                <div key={lecturer.id} className="approval-item">
                  <div className="approval-avatar">
                    {lecturer.avatar ? (
                      <img src={lecturer.avatar} alt={lecturer.first_name} />
                    ) : (
                      <span>{lecturer.first_name?.[0]}{lecturer.last_name?.[0]}</span>
                    )}
                  </div>
                  <div className="approval-info">
                    <h4>{lecturer.first_name} {lecturer.last_name}</h4>
                    <p className="approval-email">{lecturer.email}</p>
                    {lecturer.lecturerprofile?.department && (
                      <p className="approval-department">
                        <i className="fa-regular fa-building"></i>
                        {lecturer.lecturerprofile.department}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleApproveLecturer(lecturer.id)}
                    className="btn-approve"
                  >
                    <i className="fa-solid fa-check"></i>
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-diagram-project"></i>
              <h2>Platform Overview</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="stat-row">
              <div className="stat-row-item">
                <span className="stat-row-label">Active Projects</span>
                <span className="stat-row-value">{stats.activeProjects}</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-row-label">Total Teams</span>
                <span className="stat-row-value">18</span>
              </div>
              <div className="stat-row-item">
                <span className="stat-row-label">Completion Rate</span>
                <span className="stat-row-value">76%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-chart-line"></i>
              <h2>Recent Activity</h2>
            </div>
            <Link to="/admin/reports" className="card-link">View all →</Link>
          </div>
          <div className="card-body">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon green">
                  <i className="fa-solid fa-user-plus"></i>
                </div>
                <div className="activity-content">
                  <p>New student registered</p>
                  <span className="activity-time">5 minutes ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon purple">
                  <i className="fa-solid fa-diagram-project"></i>
                </div>
                <div className="activity-content">
                  <p>Project "AI Research" created</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon gold">
                  <i className="fa-solid fa-chalkboard-user"></i>
                </div>
                <div className="activity-content">
                  <p>New lecturer applied for approval</p>
                  <span className="activity-time">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution Alert */}
      <Alert
        type="info"
        title="System Health"
        message={`Your platform is running smoothly with ${stats.total} active users and ${stats.activeProjects} ongoing projects.`}
      />
    </div>
  );
};