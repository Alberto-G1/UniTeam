import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import '../../../styles/Project.css';

export const MyProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await apiService.get('/api/projects/supervised/');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'active') return p.status !== 'COMPLETED';
    if (filter === 'completed') return p.status === 'COMPLETED';
    return true;
  });

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="projects-wrapper">
      <div className="projects-header surface">
        <h1>Supervised Projects</h1>
        <div className="header-actions">
          <button
            onClick={() => setFilter('all')}
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          >
            Completed
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card surface">
              <h3>{project.title}</h3>
              <p className="description">{project.description?.substring(0, 100)}...</p>
              <div className="project-meta">
                <span className={`status ${project.status.toLowerCase()}`}>
                  {project.status}
                </span>
                <span className="team-size">
                  Team: {project.team?.members?.length || 0}
                </span>
              </div>
              <div className="project-actions">
                <Link
                  to={`/lecturer/projects/${project.id}`}
                  className="btn btn-primary"
                >
                  View Project
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No projects to supervise yet.</p>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
