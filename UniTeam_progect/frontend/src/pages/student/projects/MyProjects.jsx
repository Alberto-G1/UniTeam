import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import '../../MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.list();
      const projectData = response.results || response;
      setProjects(projectData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.delete(projectId);
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  if (loading) {
    return (
      <div className="my-projects-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-projects-container">
      <div className="my-projects-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage and track your team projects</p>
        </div>
        <Link to="/student/projects/create" className="btn btn-primary">
          + Create New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><i className="fa-solid fa-folder"></i></div>
          <p>You haven't joined any projects yet</p>
          <Link to="/student/projects/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {projects.map(project => (
            <div key={project.id} className="project-card card">
              <div className="project-card-header">
                <h3 className="project-title">{project.title}</h3>
                <div className="project-badges">
                  {project.team_membership && (
                    <span className={`badge badge-${project.team_membership.role.toLowerCase().replace('_', '-')}`}>
                      {project.team_membership.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <p className="project-description">
                {project.description?.length > 120 
                  ? `${project.description.substring(0, 120)}...` 
                  : project.description || 'No description provided'}
              </p>

              <div className="project-meta">
                <div className="project-meta-item">
                  <span className="meta-label">Supervisor:</span>
                  <span className="meta-value">
                    {project.supervisor 
                      ? `${project.supervisor.first_name} ${project.supervisor.last_name}` 
                      : 'None'}
                  </span>
                </div>
                <div className="project-meta-item">
                  <span className="meta-label">Team Size:</span>
                  <span className="meta-value">{project.team_size || 0} members</span>
                </div>
              </div>

              <div className="project-actions">
                <Link 
                  to={`/student/projects/${project.id}`} 
                  className="btn btn-secondary"
                >
                  View Details
                </Link>
                {project.team_membership && 
                 ['LEADER', 'CO_LEADER'].includes(project.team_membership.role) && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
