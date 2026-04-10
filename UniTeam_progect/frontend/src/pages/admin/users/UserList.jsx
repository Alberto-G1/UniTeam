import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../../services/api';
import './ManageUsers.css';

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.list();
      const list = Array.isArray(response) ? response : response.results || [];
      setUsers(list);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'student') return u.role === 'STUDENT';
    if (filter === 'lecturer') return u.role === 'LECTURER';
    if (filter === 'admin') return u.role === 'ADMIN';
    return true;
  });

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="users-wrapper">
      <div className="users-header surface">
        <h1>Manage Users</h1>
        <div className="header-actions">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setFilter('student')}
            className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
          >
            Students
          </button>
          <button
            onClick={() => setFilter('lecturer')}
            className={`filter-btn ${filter === 'lecturer' ? 'active' : ''}`}
          >
            Lecturers
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
          >
            Admins
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredUsers.length > 0 ? (
        <div className="users-table-wrapper surface">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/users/${u.id}/edit`} className="btn btn-sm btn-primary">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};

export default UserList;
