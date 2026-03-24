import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import '../../../styles/ManageUsers.css';

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
      const response = await apiService.get('/api/admin/lecturers/pending/');
      setPendingLecturers(response.data);
    } catch (err) {
      setError('Failed to load pending lecturers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await apiService.post(`/api/admin/lecturers/${id}/approve/`);
      setPendingLecturers(l => l.filter(x => x.id !== id));
    } catch (err) {
      setError('Failed to approve lecturer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (confirm('Are you sure you want to reject this lecturer?')) {
      setActionLoading(id);
      try {
        await apiService.post(`/api/admin/lecturers/${id}/reject/`);
        setPendingLecturers(l => l.filter(x => x.id !== id));
      } catch (err) {
        setError('Failed to reject lecturer');
      } finally {
        setActionLoading(null);
      }
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
                    <button
                      onClick={() => handleReject(l.id)}
                      className="btn btn-sm btn-danger"
                      disabled={actionLoading === l.id}
                    >
                      {actionLoading === l.id ? 'Processing...' : 'Reject'}
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
