import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI } from '../../../services/api';
import '../users/ManageUsers.css';

export const PendingLecturers = () => {
  const [pendingLecturers, setPendingLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadPendingLecturers();
  }, []);

  const loadPendingLecturers = async () => {
    try {
      const response = await usersAPI.list();
      const list = Array.isArray(response) ? response : response.results || [];
      setPendingLecturers(list.filter((u) => u.role === 'LECTURER' && !u.is_approved));
    } catch (err) {
      setError('Failed to load pending lecturers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await usersAPI.approveLecturer(id);
      setPendingLecturers(l => l.filter(x => x.id !== id));
    } catch (err) {
      setError('Failed to approve lecturer');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="loading">Loading pending lecturers...</div>;

  return (
    <div className="pending-lecturers-wrapper">
      <div className="page-header surface">
        <h1>Pending Lecturer Approvals</h1>
        <Link to="/admin/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {pendingLecturers.length > 0 ? (
        <div className="lecturers-table-wrapper surface">
          <table className="lecturers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applied Date</th>
                <th>Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLecturers.map(l => (
                <tr key={l.id}>
                  <td>{l.first_name} {l.last_name}</td>
                  <td>{l.email}</td>
                  <td>{new Date(l.date_joined).toLocaleDateString()}</td>
                  <td>{l.lecturerprofile?.courses_taught?.join(', ') || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(l.id)}
                      className="btn btn-sm btn-success"
                      disabled={actionLoading === l.id}
                    >
                      {actionLoading === l.id ? 'Processing...' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state surface">
          <p>No pending lecturer approvals. All lecturers have been reviewed! ✓</p>
        </div>
      )}
    </div>
  );
};

export default PendingLecturers;
