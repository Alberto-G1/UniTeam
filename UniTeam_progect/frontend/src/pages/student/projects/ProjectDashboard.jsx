import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { milestonesAPI, projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import './ProjectForms.css';

export const ProjectDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const [projectRes, milestonesRes, teamRes] = await Promise.all([
        projectsAPI.get(id),
        projectsAPI.getMilestones(id),
        projectsAPI.getTeam(id),
      ]);

      setProject(projectRes);
      setMilestones(milestonesRes || []);
      setTeamMembers(teamRes?.members || []);
    } catch (err) {
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (milestone, status) => {
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

  const handleTransferOwnership = async () => {
    const candidates = teamMembers.filter((m) => m.user?.id !== user?.id);
    if (candidates.length === 0) {
      showToast('info', 'No Candidates', 'Add another member before transferring ownership');
      return;
    }

    const nextLeader = candidates[0];
    setActionLoading(true);
    try {
      await projectsAPI.transferOwnership(id, nextLeader.user.id);
      showToast('success', 'Ownership Transferred', `Ownership transferred to ${nextLeader.user.first_name || nextLeader.user.username}`);
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
  const lifecycleStatus = project.lifecycle_status || project.status || 'ACTIVE';

  return (
    <div className="project-dashboard-wrapper">
      <div className="project-header surface">
        <div className="header-content">
          <h1>{project.title}</h1>
          <p className="project-status">Status: {lifecycleStatus}</p>
        </div>
        {isLeader && (
          <div className="header-actions">
            <Link to={`/student/projects/${id}/edit`} className="btn btn-primary">
              Edit Project
            </Link>
            <Link to={`/student/projects/${id}/manage-team`} className="btn btn-secondary">
              Manage Team
            </Link>
            <Link to={`/student/projects/${id}/invite-member`} className="btn btn-secondary">
              Invite Teammates
            </Link>
            {lifecycleStatus === 'ACTIVE' && (
              <button className="btn btn-primary" onClick={handleSubmitProject} disabled={actionLoading}>
                Submit Project
              </button>
            )}
            {['ACTIVE', 'SUBMITTED'].includes(lifecycleStatus) && (
              <button className="btn btn-secondary" onClick={handleArchiveProject} disabled={actionLoading}>
                Archive Project
              </button>
            )}
            {isPrimaryLeader && (
              <button className="btn btn-secondary" onClick={handleTransferOwnership} disabled={actionLoading}>
                Transfer Ownership
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleLeaveTeam} disabled={actionLoading}>
              Leave Team
            </button>
          </div>
        )}
      </div>

      <div className="project-content">
        <div className="project-section surface">
          <h2>Description</h2>
          <p>{project.description}</p>
        </div>

        <div className="project-section surface">
          <h2>Milestones ({milestones.length})</h2>
          {milestones.length > 0 ? (
            <div className="milestones-grid">
              {milestones.map(m => (
                <div key={m.id} className="milestone-card">
                  <h3>{m.title}</h3>
                  <p className={`status ${m.status.toLowerCase()}`}>{m.status}</p>
                  <p className="due-date">Due: {new Date(m.due_date).toLocaleDateString()}</p>
                  {!isLeader && (
                    <div className="mt-2">
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusUpdate(m, e.target.value)}
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

        <div className="project-section surface">
          <h2>Team Members ({teamMembers.length})</h2>
          {teamMembers.length > 0 ? (
            <div className="team-grid">
              {teamMembers.map(m => (
                <div key={m.id} className="member-card">
                  <h3>{m.user?.first_name} {m.user?.last_name}</h3>
                  <p className="role">{m.role}</p>
                  <p className="email">{m.user?.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No team members yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
