import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { invitationsAPI, milestonesAPI, projectsAPI, teamMembershipsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import ConfirmModal from '../../../components/ConfirmModal';
import SelectOwnerModal from '../../../components/SelectOwnerModal';
import './ProjectForms.css';

export const ProjectDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectInvitations, setProjectInvitations] = useState([]);
  const [invitationFilter, setInvitationFilter] = useState('ALL');
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: null,
  });
  const [selectOwnerState, setSelectOwnerState] = useState({
    isOpen: false,
  });

  useEffect(() => {
    loadProjectData();
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const getMemberName = (member) => {
    const firstName = member?.user?.first_name || '';
    const lastName = member?.user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || member?.user?.username || 'Unknown User';
  };

  const getAvatarUrl = (member) => {
    const avatar = member?.user?.avatar || '';
    if (!avatar) return '';
    return avatar.startsWith('http') ? avatar : `http://localhost:8000${avatar}`;
  };

  const getUserAvatarUrl = (userData) => {
    const avatar = userData?.avatar || '';
    if (!avatar) return '';
    return avatar.startsWith('http') ? avatar : `http://localhost:8000${avatar}`;
  };

  const getRoleLabel = (role) => {
    if (role === 'LEADER') return 'Owner';
    if (role === 'CO_LEADER') return 'Co-Leader';
    return 'Member';
  };

  const getCountdownText = (deadline) => {
    if (!deadline) return 'No deadline set';
    const remaining = new Date(deadline).getTime() - now;
    if (remaining <= 0) return 'Due today';
    const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
    return `${days} day${days === 1 ? '' : 's'} remaining`;
  };

  const loadInvitations = async (status = invitationFilter) => {
    const apiStatus = status === 'ALL' ? '' : status;
    const data = await projectsAPI.getInvitationsOverview(id, apiStatus);
    setProjectInvitations(Array.isArray(data) ? data : []);
  };

  const loadProjectData = async () => {
    try {
      const [projectRes, milestonesRes, teamRes] = await Promise.all([
        projectsAPI.get(id),
        projectsAPI.getMilestones(id),
        projectsAPI.getTeam(id),
      ]);

      setProject(projectRes);
      setMilestones(milestonesRes || []);

      const members = teamRes?.members || [];
      setTeamMembers(members);

      const requesterMembership = members.find((member) => member.user?.id === user?.id);
      if (requesterMembership && ['LEADER', 'CO_LEADER'].includes(requesterMembership.role)) {
        await loadInvitations();
      } else {
        setProjectInvitations([]);
      }
    } catch (err) {
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const applyStatusUpdate = async (milestone, status) => {
    try {
      await milestonesAPI.update(milestone.id, {
        project: Number(id),
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date,
        status,
      });
      setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? { ...m, status } : m)));
      showToast('success', 'Milestone Updated', 'Milestone status updated successfully');
    } catch (err) {
      showToast('error', 'Update Failed', 'Could not update milestone status');
    }
  };

  const openConfirm = ({ title, message, type = 'warning', action }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      type,
      action,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      isOpen: false,
      title: '',
      message: '',
      type: 'warning',
      action: null,
    });
  };

  const handleConfirm = async () => {
    if (typeof confirmState.action === 'function') {
      await confirmState.action();
    }
    closeConfirm();
  };

  const handleSubmitProject = async () => {
    setActionLoading(true);
    try {
      const data = await projectsAPI.submitProject(id);
      setProject((prev) => ({ ...prev, lifecycle_status: data.lifecycle_status }));
      showToast('success', 'Project Submitted', 'Project has been submitted successfully');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not submit project';
      showToast('error', 'Submit Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveProject = async () => {
    setActionLoading(true);
    try {
      const data = await projectsAPI.archiveProject(id);
      setProject((prev) => ({ ...prev, lifecycle_status: data.lifecycle_status }));
      showToast('success', 'Project Archived', 'Project has been archived');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not archive project';
      showToast('error', 'Archive Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteMember = async (membership) => {
    openConfirm({
      title: 'Promote to Co-Leader',
      message: `Promote ${getMemberName(membership)} to co-leader?`,
      type: 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await teamMembershipsAPI.changeRole(membership.id, 'CO_LEADER');
          showToast('success', 'Role Updated', `${getMemberName(membership)} is now a co-leader`);
          await loadProjectData();
        } catch (err) {
          const msg = err?.response?.data?.error || 'Could not promote member';
          showToast('error', 'Update Failed', msg);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRemoveMember = async (membership) => {
    openConfirm({
      title: 'Remove Member',
      message: `Remove ${getMemberName(membership)} from this project?`,
      type: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await teamMembershipsAPI.delete(membership.id);
          showToast('success', 'Member Removed', `${getMemberName(membership)} was removed from the project`);
          await loadProjectData();
        } catch (err) {
          const msg = err?.response?.data?.error || 'Could not remove member';
          showToast('error', 'Remove Failed', msg);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleInvitationFilterChange = async (status) => {
    setInvitationFilter(status);
    try {
      await loadInvitations(status);
    } catch (err) {
      showToast('error', 'Load Failed', 'Could not load invitation status data');
    }
  };

  const handleResendInvitation = async (invitation) => {
    openConfirm({
      title: 'Resend Invitation',
      message: `Resend invitation to ${invitation.receiver?.first_name || invitation.receiver?.username}?`,
      type: 'warning',
      action: async () => {
        setActionLoading(true);
        try {
          await invitationsAPI.resend(invitation.id);
          showToast('success', 'Invitation Resent', 'The invitation expiry has been extended');
          await loadInvitations();
        } catch (err) {
          const msg = err?.response?.data?.error || 'Could not resend invitation';
          showToast('error', 'Resend Failed', msg);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCancelInvitation = async (invitation) => {
    openConfirm({
      title: 'Cancel Invitation',
      message: `Cancel invitation to ${invitation.receiver?.first_name || invitation.receiver?.username}?`,
      type: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await invitationsAPI.cancel(invitation.id);
          showToast('success', 'Invitation Cancelled', 'The invitation has been cancelled');
          await loadInvitations();
        } catch (err) {
          const msg = err?.response?.data?.error || 'Could not cancel invitation';
          showToast('error', 'Cancel Failed', msg);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleTransferOwnershipClick = () => {
    const candidates = teamMembers.filter((m) => m.user?.id !== user?.id);
    if (candidates.length === 0) {
      showToast('info', 'No Candidates', 'Add another member before transferring ownership');
      return;
    }
    setSelectOwnerState({ isOpen: true });
  };

  const handleOwnerSelected = (selectedMember) => {
    setSelectOwnerState({ isOpen: false });
    const memberName = selectedMember.user?.first_name && selectedMember.user?.last_name
      ? `${selectedMember.user.first_name} ${selectedMember.user.last_name}`
      : selectedMember.user?.username || 'Unknown User';
    openConfirm({
      title: 'Confirm Ownership Transfer',
      message: `Transfer ownership to ${memberName}? They will become the new project leader.`,
      type: 'warning',
      action: () => performTransferOwnership(selectedMember.user.id),
    });
  };

  const performTransferOwnership = async (newOwnerId) => {
    setActionLoading(true);
    try {
      const newOwner = teamMembers.find((m) => m.user?.id === newOwnerId);
      await projectsAPI.transferOwnership(id, newOwnerId);
      const memberName = newOwner.user?.first_name && newOwner.user?.last_name
        ? `${newOwner.user.first_name} ${newOwner.user.last_name}`
        : newOwner.user?.username || 'Unknown User';
      showToast('success', 'Ownership Transferred', `Ownership transferred to ${memberName}`);
      loadProjectData();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not transfer ownership';
      showToast('error', 'Transfer Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setActionLoading(true);
    try {
      await projectsAPI.leaveTeam(id);
      showToast('success', 'Left Team', 'You have left this project team');
      window.location.href = '/student/projects';
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not leave team';
      showToast('error', 'Leave Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading project...</div>;
  if (!project) return <div className="error">Project not found</div>;

  const isLeader = teamMembers.some(
    m => m.user?.id === user?.id && (m.role === 'LEADER' || m.role === 'CO_LEADER')
  );
  const isPrimaryLeader = teamMembers.some(
    m => m.user?.id === user?.id && m.role === 'LEADER'
  );
  const isCoLeader = teamMembers.some(
    m => m.user?.id === user?.id && m.role === 'CO_LEADER'
  );
  const currentMembership = teamMembers.find((m) => m.user?.id === user?.id);
  const canManageInvitations = isPrimaryLeader || isCoLeader;
  const lifecycleStatus = project.lifecycle_status || project.status || 'ACTIVE';
  const lifecycleBadgeClass = lifecycleStatus === 'DRAFT' ? 'status-pending' : `status-${lifecycleStatus.toLowerCase()}`;

  return (
    <div className="project-dashboard-wrapper">
      <div className="project-header surface">
        <div className="header-content">
          <div className="project-title-block">
            <p className="project-course-code">{project.course_code || 'Course code not set'}</p>
            <h1>{project.title}</h1>
            <p className="project-subtitle">{getCountdownText(project.deadline)} · Deadline {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</p>
            {currentMembership && <p className="project-subtitle">Your role: {getRoleLabel(currentMembership.role)}</p>}
          </div>
          <div className="project-status-badges">
            <span className={`status-badge ${lifecycleBadgeClass}`}>{lifecycleStatus}</span>
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/student/projects/${id}/tasks`} className="btn btn-primary">
            Open Task Board
          </Link>
          <Link to={`/student/files?project=${id}`} className="btn btn-secondary">
            Open File Library
          </Link>
          {isPrimaryLeader && (
            <Link to={`/student/projects/${id}/edit`} className="btn btn-primary">
              Edit Project Details
            </Link>
          )}
          {isLeader && (
            <Link to={`/student/projects/${id}/invite-member`} className="btn btn-secondary">
              Invite Members
            </Link>
          )}
          {isPrimaryLeader && (
            <button
              className="btn btn-secondary"
              onClick={handleTransferOwnershipClick}
              disabled={actionLoading}
            >
              Transfer Ownership
            </button>
          )}
          {!isPrimaryLeader && (
            <button
              className="btn btn-secondary"
              onClick={() => openConfirm({
                title: 'Leave Project',
                message: 'Are you sure you want to leave this project?',
                type: 'danger',
                action: handleLeaveTeam,
              })}
              disabled={actionLoading}
            >
              Leave Project
            </button>
          )}
        </div>
      </div>

      <div className="project-content">
        <div className="project-section surface">
          <h2>Quick Stats</h2>
          <div className="quick-stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="quick-stat-card">
              <p className="quick-stat-label">Tasks</p>
              <p className="quick-stat-value">{project.task_count || 0}</p>
            </div>
            <div className="quick-stat-card">
              <p className="quick-stat-label">Task Progress</p>
              <p className="quick-stat-value">{project.task_progress_percentage || 0}%</p>
            </div>
            <div className="quick-stat-card">
              <p className="quick-stat-label">Milestones</p>
              <p className="quick-stat-value">{milestones.length}</p>
            </div>
          </div>
        </div>

        <div className="project-section surface" style={{ paddingBottom: '1.5rem' }}>
          <h2>Project Description</h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, marginBottom: 0 }}>{project.description || 'No project description provided yet.'}</p>
        </div>

        <div className="project-section surface">
          <div className="section-heading-row">
            <h2>Members Panel ({teamMembers.length})</h2>
            {isPrimaryLeader && <span className="section-helper">Owner controls available</span>}
          </div>
          {teamMembers.length > 0 ? (
            <div className="team-grid">
              {teamMembers.map((member) => {
                const isOwner = member.role === 'LEADER';
                const memberName = getMemberName(member);
                const avatarUrl = getAvatarUrl(member);
                return (
                  <div key={member.id} className="member-card">
                    <div className="member-card-top">
                      <div className="member-avatar">
                        {avatarUrl ? <img src={avatarUrl} alt={memberName} /> : <span>{memberName.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div className="member-details">
                        <h3>{memberName}</h3>
                        <p className="email">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="member-footer">
                      <span className={`role-badge ${member.role === 'LEADER' ? 'badge-leader' : member.role === 'CO_LEADER' ? 'badge-co-leader' : 'badge-member'}`}>
                        {getRoleLabel(member.role)}
                      </span>
                      {isPrimaryLeader && !isOwner && (
                        <div className="member-actions-inline">
                          {member.role === 'MEMBER' && (
                            <button className="btn btn-secondary" onClick={() => handlePromoteMember(member)} disabled={actionLoading}>
                              Promote to Co-Leader
                            </button>
                          )}
                          <button className="btn btn-danger" onClick={() => handleRemoveMember(member)} disabled={actionLoading}>
                            Remove from Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No team members yet</p>
          )}
        </div>

        {canManageInvitations && (
          <div className="project-section surface">
            <div className="section-heading-row">
              <h2>Invitation Status Panel</h2>
              <span className="section-helper">Visible to owner and co-leaders</span>
            </div>
            <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
              {['ALL', 'PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-tab ${invitationFilter === status ? 'active' : ''}`}
                  onClick={() => handleInvitationFilterChange(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {projectInvitations.length > 0 ? (
              <div className="team-grid">
                {projectInvitations.map((invitation) => {
                  const canResend = invitation.status !== 'ACCEPTED';
                  const canCancel = invitation.status === 'PENDING';
                  return (
                    <div key={invitation.id} className="member-card">
                      <div className="member-card-top">
                        <div className="member-avatar">
                          {getUserAvatarUrl(invitation.receiver) ? <img src={getUserAvatarUrl(invitation.receiver)} alt={invitation.receiver?.username} /> : <span>{(invitation.receiver?.first_name || invitation.receiver?.username || '?').charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="member-details">
                          <h3>{invitation.receiver?.first_name || invitation.receiver?.username}</h3>
                          <p className="email">{invitation.receiver?.email}</p>
                        </div>
                      </div>
                      <div className="member-footer">
                        <span className={`status-badge status-${String(invitation.status || '').toLowerCase()}`}>
                          {invitation.status}
                        </span>
                        <p className="email" style={{ marginBottom: 0 }}>
                          Expires: {invitation.expires_at ? new Date(invitation.expires_at).toLocaleString() : 'N/A'}
                        </p>
                        <div className="member-actions-inline">
                          <button className="btn btn-secondary" onClick={() => handleResendInvitation(invitation)} disabled={!canResend || actionLoading}>
                            Resend
                          </button>
                          {canCancel && (
                            <button className="btn btn-danger" onClick={() => handleCancelInvitation(invitation)} disabled={actionLoading}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No invitations match the current filter.</p>
            )}
          </div>
        )}

        <div className="project-section surface">
          <h2>Milestones ({milestones.length})</h2>
          {milestones.length > 0 ? (
            <div className="milestones-grid">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="milestone-card">
                  <h3>{milestone.title}</h3>
                  <p className={`status ${milestone.status.toLowerCase()}`}>{milestone.status}</p>
                  <p className="due-date">Due: {new Date(milestone.due_date).toLocaleDateString()}</p>
                  {!isLeader && (
                    <div className="mt-2">
                      <select
                        value={milestone.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          openConfirm({
                            title: 'Update Milestone Status',
                            message: `Change milestone "${milestone.title}" status to ${nextStatus}?`,
                            type: 'info',
                            action: () => applyStatusUpdate(milestone, nextStatus),
                          });
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No milestones yet</p>
          )}
          {isLeader && (
            <Link to={`/student/projects/${id}/milestones/create`} className="btn btn-primary mt-3">
              Add Milestone
            </Link>
          )}
        </div>
      </div>

      <SelectOwnerModal
        isOpen={selectOwnerState.isOpen}
        onClose={() => setSelectOwnerState({ isOpen: false })}
        onSelect={handleOwnerSelected}
        teamMembers={teamMembers}
        currentUserId={user?.id}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ProjectDashboard;
