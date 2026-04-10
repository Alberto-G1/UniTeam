import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, teamMembershipsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import './ProjectForms.css';

export const ManageTeam = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      const team = await projectsAPI.getTeam(id);
      setTeamMembers(team?.members || []);
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await teamMembershipsAPI.changeRole(memberId, newRole);
      showToast('success', 'Role Updated', 'Team member role updated');
      await loadTeamData();
    } catch (err) {
      setError('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await teamMembershipsAPI.delete(memberId);
        showToast('success', 'Member Removed', 'Team member was removed');
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
        <div className="header-actions">
          <Link to={`/student/projects/${id}/invite-member`} className="btn btn-primary">
            Invite Teammates
          </Link>
          <Link to={`/student/projects/${id}`} className="btn btn-secondary">
            Back to Project
          </Link>
        </div>
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

    </div>
  );
};

export default ManageTeam;
