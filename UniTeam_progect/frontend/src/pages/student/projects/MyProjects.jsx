// src/pages/student/projects/MyProjects.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import ConfirmModal from '../../../components/ConfirmModal';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { showToast } = useToast();

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
      showToast('error', 'Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      await projectsAPI.delete(selectedProject.id);
      fetchProjects();
      showToast('success', 'Deleted', `Project "${selectedProject.title}" has been deleted`);
      setDeleteModalOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('error', 'Error', 'Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && project.status !== 'COMPLETED') ||
      (filter === 'completed' && project.status === 'COMPLETED');
    
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'LEADER': return 'badge-leader';
      case 'CO_LEADER': return 'badge-co-leader';
      default: return 'badge-member';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'COMPLETED': return 'status-completed';
      case 'ON_HOLD': return 'status-hold';
      default: return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="my-projects-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-projects-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>My Projects</h1>
          <p className="page-description">Manage and track all your team projects</p>
        </div>
        <Link to="/student/projects/create" className="btn-primary">
          <i className="fa-solid fa-plus"></i>
          Create New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Projects
            <span className="filter-count">{projects.length}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
            <span className="filter-count">{projects.filter(p => p.status !== 'COMPLETED').length}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
            <span className="filter-count">{projects.filter(p => p.status === 'COMPLETED').length}</span>
          </button>
        </div>

        <div className="search-wrapper">
          <i className="fa-solid fa-search"></i>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fa-regular fa-folder-open"></i>
          </div>
          <h3>No projects found</h3>
          <p>Get started by creating your first project</p>
          <Link to="/student/projects/create" className="btn-primary">
            Create New Project
          </Link>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-badges">
                  {project.team_membership && (
                    <span className={`role-badge ${getRoleBadgeClass(project.team_membership.role)}`}>
                      {project.team_membership.role.replace('_', ' ')}
                    </span>
                  )}
                  <span className={`status-badge ${getStatusBadgeClass(project.status)}`}>
                    {project.status || 'ACTIVE'}
                  </span>
                </div>
                {project.team_membership && 
                 ['LEADER', 'CO_LEADER'].includes(project.team_membership.role) && (
                  <button 
                    className="project-delete-btn"
                    onClick={() => handleDeleteClick(project)}
                    title="Delete Project"
                  >
                    <i className="fa-regular fa-trash-alt"></i>
                  </button>
                )}
              </div>

              <h3 className="project-title">{project.title}</h3>
              
              <p className="project-description">
                {project.description?.substring(0, 120) || 'No description provided'}
                {project.description?.length > 120 && '...'}
              </p>

              <div className="project-meta-grid">
                <div className="meta-item">
                  <i className="fa-regular fa-user"></i>
                  <span>Supervisor: {project.supervisor?.first_name || 'Not assigned'}</span>
                </div>
                <div className="meta-item">
                  <i className="fa-regular fa-users"></i>
                  <span>Team: {project.team_size || 0} members</span>
                </div>
                <div className="meta-item">
                  <i className="fa-regular fa-calendar"></i>
                  <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="project-progress-section">
                <div className="progress-label">
                  <span>Overall Progress</span>
                  <span className="progress-percent">65%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="project-actions">
                <Link 
                  to={`/student/projects/${project.id}`} 
                  className="btn-secondary-sm"
                >
                  <i className="fa-regular fa-eye"></i>
                  View Details
                </Link>
                {project.team_membership && 
                 ['LEADER', 'CO_LEADER'].includes(project.team_membership.role) && (
                  <Link 
                    to={`/student/projects/${project.id}/edit`} 
                    className="btn-outline-sm"
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        type="danger"
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.title}"? This will permanently remove the project and all associated data. This action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
      />
    </div>
  );
}