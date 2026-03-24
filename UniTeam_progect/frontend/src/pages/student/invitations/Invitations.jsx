import { useState, useEffect } from 'react';
import { invitationsAPI } from '../../../services/api';
import '../../Invitations.css';

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await invitationsAPI.list();
      const invData = response.results || response;
      setInvitations(invData.filter(inv => inv.status === 'PENDING'));
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invId) => {
    try {
      await invitationsAPI.accept(invId);
      fetchInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    }
  };

  const handleDecline = async (invId) => {
    try {
      await invitationsAPI.decline(invId);
      fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="invitations-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="invitations-container">
      <div className="invitations-header">
        <div>
          <h1>My Project Invitations</h1>
          <p>You have {invitations.length} pending invitation(s)</p>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-inbox"></i></div>
          <p>You have no pending project invitations</p>
        </div>
      ) : (
        <div className="invitations-list">
          {invitations.map(invitation => (
            <div key={invitation.id} className="invitation-card surface">
              <div className="invitation-content">
                <div className="invitation-info">
                  <p className="invitation-from">
                    Invitation from <strong>
                      {invitation.sender?.first_name} {invitation.sender?.last_name}
                    </strong>
                  </p>
                  <p className="invitation-project">
                    Project: <strong>{invitation.project?.title}</strong>
                  </p>
                  {invitation.project?.description && (
                    <p className="invitation-description">
                      {invitation.project.description}
                    </p>
                  )}
                </div>
                <div className="invitation-actions">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleAccept(invitation.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDecline(invitation.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
