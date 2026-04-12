import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import '../../student/projects/MyProjects.css';

export const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [courseCodeQuery, setCourseCodeQuery] = useState('');
  const [courseSearchResults, setCourseSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [linkingProjectId, setLinkingProjectId] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      const list = response?.results || response || [];
      setProjects(list);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const matches = projects.filter((project) => {
      const lifecycleStatus = project.lifecycle_status || project.status || 'ACTIVE';
      if (filter === 'active') return ['DRAFT', 'ACTIVE'].includes(lifecycleStatus);
      if (filter === 'submitted') return lifecycleStatus === 'SUBMITTED';
      if (filter === 'archived') return lifecycleStatus === 'ARCHIVED';
      return true;
    });

    return [...matches].sort((a, b) => {
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return aDeadline - bDeadline;
    });
  }, [projects, filter]);

  const activeCount = projects.filter((project) => ['DRAFT', 'ACTIVE'].includes(project.lifecycle_status || project.status || 'ACTIVE')).length;
  const submittedCount = projects.filter((project) => (project.lifecycle_status || project.status || 'ACTIVE') === 'SUBMITTED').length;
  const archivedCount = projects.filter((project) => (project.lifecycle_status || project.status || 'ACTIVE') === 'ARCHIVED').length;

  const getDeadlineCountdown = (deadline) => {
    if (!deadline) return 'No deadline set';

    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;
    const dayMs = 1000 * 60 * 60 * 24;

    if (Number.isNaN(deadlineTime)) return 'Invalid deadline';
    if (diff <= 0) return 'Deadline reached';

    const daysRemaining = Math.ceil(diff / dayMs);
    return `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`;
  };

  const handleSearchByCourseCode = async () => {
    const query = courseCodeQuery.trim();
    if (!query) {
      setCourseSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await projectsAPI.searchByCourseCode(query);
      setCourseSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      showToast('error', 'Search Failed', 'Could not search projects by course code');
    } finally {
      setSearching(false);
    }
  };

  const handleLinkProject = async (project) => {
    setLinkingProjectId(project.id);
    try {
      await projectsAPI.linkLecturer(project.id, courseCodeQuery.trim());
      showToast('success', 'Project Linked', 'You are now linked to this project');
      await loadProjects();
      const updatedResults = await projectsAPI.searchByCourseCode(courseCodeQuery.trim());
      setCourseSearchResults(Array.isArray(updatedResults) ? updatedResults : []);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not link to project';
      showToast('error', 'Link Failed', msg);
    } finally {
      setLinkingProjectId(null);
    }
  };

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
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
          >
            Archived ({archivedCount})
          </button>
        </div>
      </div>

      <div className="surface" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Link a Project by Course Code</h2>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          Search for projects created under a course code, then click Monitor This Project to link yourself.
        </p>
        <div className="form-row" style={{ alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="course-code-search">Course Code</label>
            <input
              id="course-code-search"
              type="text"
              className="form-input"
              value={courseCodeQuery}
              onChange={(e) => setCourseCodeQuery(e.target.value)}
              placeholder="e.g. SOFTENG 350"
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSearchByCourseCode} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {courseSearchResults.length > 0 && (
          <div className="projects-grid" style={{ marginTop: '1rem' }}>
            {courseSearchResults.map((project) => (
              <div key={project.id} className="project-card surface">
                <h3>{project.title}</h3>
                <p className="description">{project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}</p>
                <div className="project-meta">
                  <span className={`status ${project.status.toLowerCase()}`}>{project.status}</span>
                  <span className="team-size">Team: {project.team_size || 0}</span>
                </div>
                <div className="project-actions">
                  <Link to={`/lecturer/projects/${project.id}`} className="btn btn-secondary">
                    View Project
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!project.can_link_as_supervisor || linkingProjectId === project.id}
                    onClick={() => handleLinkProject(project)}
                  >
                    {linkingProjectId === project.id
                      ? 'Linking...'
                      : project.can_link_as_supervisor
                        ? 'Monitor This Project'
                        : (project.supervisor?.id === user?.id ? 'Linked' : `Linked to ${project.supervisor_name || 'another lecturer'}`)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  Team: {project.team_size || project.team?.members?.length || 0}
                </span>
              </div>
              <p className="text-muted" style={{ marginTop: '0.4rem', marginBottom: '0.75rem' }}>
                Due: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'} · {getDeadlineCountdown(project.deadline)}
              </p>
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
