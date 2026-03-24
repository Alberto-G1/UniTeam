import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import './ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      let userData = response.data.results || response.data;
      
      // Apply filter
      if (filter !== 'all') {
        userData = userData.filter(user => user.role === filter.toUpperCase());
      }
      
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await usersAPI.updateUser(userId, { lecturerprofile: { is_approved: true } });
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.first_name + ' ' + user.last_name).toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="manage-users-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      <div className="manage-users-header">
        <div>
          <h1>Manage Users</h1>
          <p>View and manage all system users</p>
        </div>
      </div>

      <div className="manage-users-filters">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users ({users.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
            onClick={() => setFilter('student')}
          >
            Students
          </button>
          <button 
            className={`filter-btn ${filter === 'lecturer' ? 'active' : ''}`}
            onClick={() => setFilter('lecturer')}
          >
            Lecturers
          </button>
          <button 
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
        </div>
        
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-users"></i></div>
          <p>No users found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username}
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="user-name">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.role === 'LECTURER' && user.lecturerprofile && !user.lecturerprofile.is_approved ? (
                      <span className="status-badge status-pending">Pending</span>
                    ) : (
                      <span className="status-badge status-active">Active</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'LECTURER' && user.lecturerprofile && !user.lecturerprofile.is_approved && (
                        <button 
                          className="btn-action btn-approve"
                          onClick={() => handleApprove(user.id)}
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
