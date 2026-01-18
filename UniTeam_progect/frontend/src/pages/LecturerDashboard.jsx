import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, projectTemplatesAPI } from '../services/api';
import './Dashboard.css';

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, templatesData] = await Promise.all([
          projectsAPI.list(),
          projectTemplatesAPI.list(),
        ]);
        
        // Handle paginated responses from DRF
        const projectsList = Array.isArray(projectsData) ? projectsData : projectsData.results || [];
        const templatesList = Array.isArray(templatesData) ? templatesData : templatesData.results || [];
        
        setProjects(projectsList);
        setTemplates(templatesList);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.full_name || user?.username}</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{projects.length}</h3>
          <p>Supervised Projects</p>
        </div>
        <div className="stat-card">
          <h3>{templates.length}</h3>
          <p>Project Templates</p>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Supervised Projects</h2>
          <Link to="/projects" className="btn btn-primary">
            View All
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <p className="empty-state">No projects assigned yet.</p>
        ) : (
          <div className="projects-grid">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card"
              >
                <h3>{project.title}</h3>
                <p>{project.course_code}</p>
                <p className="text-muted">
                  Team: {project.team?.members?.length || 0} members
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Project Templates</h2>
          <Link to="/templates/create" className="btn btn-success">
            Create Template
          </Link>
        </div>
        
        {templates.length === 0 ? (
          <p className="empty-state">
            No templates yet. <Link to="/templates/create">Create your first template</Link>
          </p>
        ) : (
          <div className="templates-list">
            {templates.slice(0, 5).map((template) => (
              <div key={template.id} className="template-item">
                <h4>{template.title}</h4>
                <p>{template.course_code}</p>
                <span className="badge">
                  {template.milestone_templates?.length || 0} milestones
                </span>
              </div>
            ))}
          </div>
        )}
        
        {templates.length > 5 && (
          <Link to="/templates" className="view-all-link">
            View all templates →
          </Link>
        )}
      </div>
    </div>
  );
};
