import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import '../../../styles/ManageTeam.css';

export const ManageTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState('MEMBER');

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiService.get(`/api/projects/${id}/team/`),
        apiService.get(`/api/projects/${id}/invitations/pending/`),
      ]);
      setTeamMembers(membersRes.data);
      setPendingInvites(invitesRes.data);
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await apiService.post(`/api/projects/${id}/invite/`, {
        recipient_email: inviteEmail,
        role,
      });
      setInviteEmail('');
      setRole('MEMBER');
      await loadTeamData();
    } catch (err) {
      setError('Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await apiService.put(`/api/projects/${id}/team/${memberId}/`, {
        role: newRole,
      });
      await loadTeamData();
    } catch (err) {
      setError('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await apiService.delete(`/api/projects/${id}/team/${memberId}/`);
        await loadTeamData();
      } catch (err) {
        setError('Failed to remove member');
      }
    }
  };

  if (loading) return <div className="loading">Loading team...</div>;

  return (
    <div className="manage-team-wrapper">
      <div className="team-header surface">
        <h1>Manage Team</h1>
        <Link to={`/student/projects/${id}`} className="btn btn-secondary">
          Back to Project
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Current Team Members */}
      <div className="team-section surface">
        <h2>Team Members ({teamMembers.length})</h2>
        <div className="members-list">
          {teamMembers.map(m => (
            <div key={m.id} className="member-row">
              <div className="member-info">
                <p className="member-name">{m.user?.first_name} {m.user?.last_name}</p>
                <p className="member-email">{m.user?.email}</p>
              </div>
              <div className="member-actions">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="role-select"
                >
                  <option value="MEMBER">Member</option>
                  <option value="CO_LEADER">Co-Leader</option>
                  <option value="LEADER">Leader</option>
                </select>
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  className="btn btn-danger"
                  disabled={teamMembers.filter(x => x.role === 'LEADER').length === 1 && m.role === 'LEADER'}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="invites-section surface">
          <h2>Pending Invitations</h2>
          <div className="invites-list">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="invite-row">
                <p>{inv.recipient_email}</p>
                <span className="status">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Invitation */}
      <div className="invite-section surface">
        <h2>Invite New Member</h2>
        <form onSubmit={handleInvite} className="invite-form">
          <div className="form-group">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter team member email"
              required
            />
          </div>
          <div className="form-group">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="CO_LEADER">Co-Leader</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Send Invitation
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManageTeam;
