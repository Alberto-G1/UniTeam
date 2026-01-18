import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, invitationsAPI } from '../services/api';
import './Dashboard.css';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, invitationsData] = await Promise.all([
          projectsAPI.list(),
          invitationsAPI.list(),
        ]);
        
        // Handle paginated responses from DRF
        const projectsList = Array.isArray(projectsData) ? projectsData : projectsData.results || [];
        const invitationsList = Array.isArray(invitationsData) ? invitationsData : invitationsData.results || [];
        
        setProjects(projectsList);
        setInvitations(invitationsList.filter(inv => inv.status === 'PENDING'));
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
      <h1>Welcome back, {user?.first_name || user?.username}!</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{projects.length}</h3>
          <p>Active Projects</p>
        </div>
        <div className="stat-card">
          <h3>{invitations.length}</h3>
          <p>Pending Invitations</p>
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="dashboard-section">
          <h2>Pending Invitations</h2>
          <div className="alert alert-info">
            You have {invitations.length} pending invitation(s).{' '}
            <Link to="/invitations">View all</Link>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header">
          <h2>My Projects</h2>
          <Link to="/projects/create" className="btn btn-primary">
            Create New Project
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <p className="empty-state">
            No projects yet. <Link to="/projects/create">Create your first project</Link>
          </p>
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
                  Due: {new Date(project.deadline).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
        
        {projects.length > 4 && (
          <Link to="/projects" className="view-all-link">
            View all projects →
          </Link>
        )}
      </div>
    </div>
  );
};
