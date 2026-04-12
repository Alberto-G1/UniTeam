// src/components/SelectOwnerModal.jsx
import { useState, useEffect } from 'react';
import './SelectOwnerModal.css';

const SelectOwnerModal = ({ isOpen, onClose, onSelect, teamMembers = [], currentUserId = null }) => {
  const [selectedOwner, setSelectedOwner] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const candidates = teamMembers.filter((m) => m.user?.id !== currentUserId);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectAndConfirm = () => {
    if (selectedOwner) {
      onSelect(selectedOwner);
      setSelectedOwner(null);
    }
  };

  const getMemberName = (member) => {
    return member.user?.first_name && member.user?.last_name
      ? `${member.user.first_name} ${member.user.last_name}`
      : member.user?.username || 'Unknown User';
  };

  return (
    <div className="select-owner-modal-overlay" onClick={handleOverlayClick}>
      <div className="select-owner-modal">
        <div className="select-owner-modal-header">
          <h2>Select New Owner</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="select-owner-modal-body">
          <p className="select-owner-description">
            Choose a team member to transfer ownership to:
          </p>

          {candidates.length === 0 ? (
            <div className="no-candidates">
              <p>No team members available to transfer ownership to.</p>
            </div>
          ) : (
            <div className="candidates-list">
              {candidates.map((member) => (
                <div
                  key={member.id}
                  className={`candidate-item ${selectedOwner?.id === member.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOwner(member)}
                >
                  <input
                    type="radio"
                    id={`owner-${member.id}`}
                    name="owner"
                    value={member.id}
                    checked={selectedOwner?.id === member.id}
                    onChange={() => setSelectedOwner(member)}
                  />
                  <label htmlFor={`owner-${member.id}`}>
                    <div className="member-info">
                      <div className="member-name">{getMemberName(member)}</div>
                      <div className="member-role">{member.role}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="select-owner-modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSelectAndConfirm}
            disabled={!selectedOwner}
          >
            Select as New Owner
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectOwnerModal;
