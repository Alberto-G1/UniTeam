import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import './Dashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    lecturers: 0,
    pendingLecturers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await usersAPI.list();
        
        // Handle paginated responses from DRF
        const usersList = Array.isArray(usersData) ? usersData : usersData.results || [];
        setUsers(usersList);
        
        // Calculate stats
        setStats({
          total: usersList.length,
          students: usersList.filter(u => u.role === 'STUDENT').length,
          lecturers: usersList.filter(u => u.role === 'LECTURER' && u.is_approved).length,
          pendingLecturers: usersList.filter(u => u.role === 'LECTURER' && !u.is_approved).length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveLecturer = async (lecturerId) => {
    try {
      await usersAPI.approveLecturer(lecturerId);
      // Refresh users list
      const usersData = await usersAPI.list();
      const usersList = Array.isArray(usersData) ? usersData : usersData.results || [];
      setUsers(usersList);
      setStats(prev => ({
        ...prev,
        lecturers: prev.lecturers + 1,
        pendingLecturers: prev.pendingLecturers - 1,
      }));
    } catch (error) {
      console.error('Failed to approve lecturer:', error);
      alert('Failed to approve lecturer');
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
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.students}</h3>
          <p>Students</p>
        </div>
        <div className="stat-card">
          <h3>{stats.lecturers}</h3>
          <p>Approved Lecturers</p>
        </div>
        <div className="stat-card alert-card">
          <h3>{stats.pendingLecturers}</h3>
          <p>Pending Approvals</p>
        </div>
      </div>

      {pendingLecturers.length > 0 && (
        <div className="dashboard-section">
          <h2>Pending Lecturer Approvals</h2>
          <div className="approval-list">
            {pendingLecturers.map((lecturer) => (
              <div key={lecturer.id} className="approval-card">
                <div className="approval-info">
                  <h4>{lecturer.full_name || lecturer.username}</h4>
                  <p>{lecturer.email}</p>
                  {lecturer.lecturerprofile?.department && (
                    <p className="text-muted">{lecturer.lecturerprofile.department}</p>
                  )}
                </div>
                <button
                  onClick={() => handleApproveLecturer(lecturer.id)}
                  className="btn btn-success"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header">
          <h2>User Management</h2>
          <Link to="/users" className="btn btn-primary">
            Manage All Users
          </Link>
        </div>
        
        <div className="quick-stats">
          <div className="stat-item">
            <span>Recent Signups:</span>
            <span>{users.slice(-7).length} (last 7 days)</span>
          </div>
          <div className="stat-item">
            <span>Active Projects:</span>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
