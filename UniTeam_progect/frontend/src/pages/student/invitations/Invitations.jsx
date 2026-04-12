// src/pages/student/invitations/Invitations.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { invitationsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import ConfirmModal from '../../../components/ConfirmModal';
import './Invitations.css';

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await invitationsAPI.list();
      const invData = response.results || response;
      setInvitations(invData.filter(inv => ['PENDING', 'EXPIRED'].includes(inv.status)));
    } catch (error) {
      console.error('Error fetching invitations:', error);
      showToast('error', 'Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptClick = (invitation) => {
    setSelectedInvitation(invitation);
    setAcceptModalOpen(true);
  };

  const handleAcceptConfirm = async () => {
    if (!selectedInvitation) return;
    
    try {
      await invitationsAPI.accept(selectedInvitation.id);
      fetchInvitations();
      showToast('success', 'Accepted', `You have joined the project "${selectedInvitation.project?.title}"`);
      setAcceptModalOpen(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast('error', 'Error', 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitation) => {
    if (window.confirm(`Are you sure you want to decline the invitation to join "${invitation.project?.title}"?`)) {
      try {
        await invitationsAPI.decline(invitation.id);
        fetchInvitations();
        showToast('info', 'Declined', 'Invitation has been declined');
      } catch (error) {
        console.error('Error declining invitation:', error);
        showToast('error', 'Error', 'Failed to decline invitation');
      }
    }
  };

  if (loading) {
    return (
      <div className="invitations-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="invitations-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Project Invitations</h1>
          <p className="page-description">You have {invitations.filter(i => i.status === 'PENDING').length} pending invitation(s)</p>
        </div>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fa-regular fa-envelope-open"></i>
          </div>
          <h3>No pending invitations</h3>
          <p>When you receive project invitations, they will appear here</p>
        </div>
      ) : (
        <div className="invitations-list">
          {invitations.map(invitation => (
            <div key={invitation.id} className="invitation-card">
              <div className="invitation-icon">
                <i className="fa-solid fa-envelope"></i>
              </div>
              
              <div className="invitation-content">
                <div className="invitation-header">
                  <h3>{invitation.project?.title}</h3>
                  <span className="invitation-badge">{invitation.status}</span>
                </div>
                
                <p className="invitation-message">
                  <strong>{invitation.sender?.first_name} {invitation.sender?.last_name}</strong> 
                  {' '}has invited you to join this project as a <strong>{invitation.role?.toLowerCase() || 'member'}</strong>.
                </p>
                
                {invitation.project?.description && (
                  <p className="invitation-description">
                    {invitation.project.description}
                  </p>
                )}
                
                <div className="invitation-meta">
                  <div className="meta-item">
                    <i className="fa-regular fa-calendar"></i>
                    <span>Sent: {new Date(invitation.sent_at).toLocaleDateString()}</span>
                  </div>
                  {invitation.expires_at && (
                    <div className="meta-item">
                      <i className="fa-regular fa-hourglass"></i>
                      <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {invitation.project?.deadline && (
                    <div className="meta-item">
                      <i className="fa-regular fa-clock"></i>
                      <span>Project deadline: {new Date(invitation.project.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="invitation-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleAcceptClick(invitation)}
                  disabled={invitation.status !== 'PENDING'}
                >
                  <i className="fa-solid fa-check"></i>
                  Accept
                </button>
                <button
                  className="btn-decline"
                  onClick={() => handleDecline(invitation)}
                  disabled={invitation.status !== 'PENDING'}
                >
                  <i className="fa-solid fa-times"></i>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accept Confirmation Modal */}
      <ConfirmModal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        onConfirm={handleAcceptConfirm}
        type="info"
        title="Accept Invitation"
        message={`Are you sure you want to join the project "${selectedInvitation?.project?.title}"? You will be added as a ${selectedInvitation?.role?.toLowerCase() || 'member'} of the team.`}
        confirmText="Accept Invitation"
        cancelText="Cancel"
      />
    </div>
  );
}