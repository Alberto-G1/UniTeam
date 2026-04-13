import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import '../../student/projects/ProjectForms.css';

export const ProjectDashboard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const recentFilesRes = await projectsAPI.getRecentFiles(id);

      setProject(projectRes);
      setMilestones(milestonesRes || []);
      setTeamMembers(teamRes?.members || []);
      setRecentFiles(Array.isArray(recentFilesRes) ? recentFilesRes : []);
    } catch (err) {
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-dashboard-wrapper">
      <div className="project-header surface">
        <div className="header-content">
          <h1>{project.title}</h1>
          <p className="project-status">Status: {project.status}</p>
        </div>
        <div className="header-actions">
          <Link to={`/lecturer/files?project=${id}`} className="btn btn-secondary">Open File Library</Link>
          <span className="btn btn-secondary">Supervisor View</span>
        </div>
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
                </div>
              ))}
            </div>
          ) : (
            <p>No milestones</p>
          )}
        </div>

        <div className="project-section surface">
          <h2>Team Members</h2>
          {teamMembers.length > 0 ? (
            <div className="team-grid">
              {teamMembers.map(m => (
                <div key={m.id} className="member-card">
                  <h3>{m.user?.first_name} {m.user?.last_name}</h3>
                  <p className="email">{m.user?.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No team members</p>
          )}
        </div>

        <div className="project-section surface">
          <h2>Recent Files</h2>
          {recentFiles.length > 0 ? (
            <div className="team-grid">
              {recentFiles.map((file) => (
                <div key={file.id} className="member-card">
                  <h3>{file.display_name}</h3>
                  <p className="email">{file.tag} · v{file.current_version_number} · {file.folder?.name || 'General'}</p>
                  <p className="email">{file.uploaded_by?.username || 'Unknown'} · {file.current_version_file?.upload_timestamp ? new Date(file.current_version_file.upload_timestamp).toLocaleString() : 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent file activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
