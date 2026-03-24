import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import '../../../styles/ManageTeam.css';

export const ManageTeam = () => {
  const { id } = useParams();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      const response = await apiService.get(`/api/projects/${id}/team/`);
      setTeamMembers(response.data);
    } catch (err) {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="manage-team-wrapper">
      <div className="team-header surface">
        <h1>Team Members</h1>
        <Link to={`/lecturer/projects/${id}`} className="btn btn-secondary">
          Back to Project
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="team-section surface">
        <h2>Project Team ({teamMembers.length})</h2>
        {teamMembers.length > 0 ? (
          <div className="members-list">
            {teamMembers.map(m => (
              <div key={m.id} className="member-row">
                <div className="member-info">
                  <p className="member-name">{m.user?.first_name} {m.user?.last_name}</p>
                  <p className="member-email">{m.user?.email}</p>
                  <p className="member-role">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No team members yet</p>
        )}
      </div>
    </div>
  );
};

export default ManageTeam;
