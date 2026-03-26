// src/pages/admin/users/ManageUsers.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import Alert from '../../../components/Alert';
import ConfirmModal from '../../../components/ConfirmModal';
import './ManageUsers.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.list();
      let userData = response.results || response;
      
      if (filter !== 'all') {
        userData = userData.filter(user => user.role === filter.toUpperCase());
      }
      
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await usersAPI.approveLecturer(userId);
      fetchUsers();
      showToast('success', 'Approved', 'Lecturer account has been approved');
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('error', 'Error', 'Failed to approve user');
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await usersAPI.delete(selectedUser.id);
      fetchUsers();
      showToast('success', 'Deleted', `User ${selectedUser.first_name} has been deleted`);
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', 'Error', 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
    );
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'STUDENT': return 'badge-student';
      case 'LECTURER': return 'badge-lecturer';
      case 'ADMIN': return 'badge-admin';
      default: return 'badge-default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'STUDENT': return 'fa-user-graduate';
      case 'LECTURER': return 'fa-chalkboard-user';
      case 'ADMIN': return 'fa-shield-halved';
      default: return 'fa-user';
    }
  };

  if (loading) {
    return (
      <div className="manage-users-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Manage Users</h1>
          <p className="page-description">View and manage all system users</p>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <i className="fa-solid fa-users"></i>
            <span>{users.length} Total</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
            <span className="filter-count">{users.length}</span>
          </button>
          <button 
            className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
            onClick={() => setFilter('student')}
          >
            <i className="fa-solid fa-user-graduate"></i>
            Students
            <span className="filter-count">{users.filter(u => u.role === 'STUDENT').length}</span>
          </button>
          <button 
            className={`filter-btn ${filter === 'lecturer' ? 'active' : ''}`}
            onClick={() => setFilter('lecturer')}
          >
            <i className="fa-solid fa-chalkboard-user"></i>
            Lecturers
            <span className="filter-count">{users.filter(u => u.role === 'LECTURER').length}</span>
          </button>
          <button 
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            Admins
            <span className="filter-count">{users.filter(u => u.role === 'ADMIN').length}</span>
          </button>
        </div>
        
        <div className="search-wrapper">
          <i className="fa-solid fa-search"></i>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <h3>No users found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="user-row">
                  <td className="user-cell">
                    <div className="user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} />
                      ) : (
                        <span>{user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="user-username">@{user.username}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td className="role-cell">
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      <i className={`fa-solid ${getRoleIcon(user.role)}`}></i>
                      {user.role}
                    </span>
                  </td>
                  <td className="status-cell">
                    {user.role === 'LECTURER' && user.lecturerprofile && !user.lecturerprofile.is_approved ? (
                      <span className="status-badge pending">
                        <i className="fa-solid fa-clock"></i>
                        Pending Approval
                      </span>
                    ) : (
                      <span className="status-badge active">
                        <i className="fa-solid fa-circle-check"></i>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="joined-cell">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {user.role === 'LECTURER' && user.lecturerprofile && !user.lecturerprofile.is_approved && (
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprove(user.id)}
                          title="Approve Lecturer"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                      <Link 
                        to={`/admin/users/${user.id}/edit`} 
                        className="action-btn edit"
                        title="Edit User"
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </Link>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteClick(user)}
                        title="Delete User"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.first_name} ${selectedUser?.last_name}? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
      />
    </div>
  );
}