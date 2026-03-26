// src/pages/student/dashboard/StudentDashboard.jsx (updated)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI, invitationsAPI } from '../../../services/api';
import StatCard from '../../../components/StatCard';
import ProgressBar from '../../../components/ProgressBar';
import '../../Dashboard.css';

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
      <div className="dashboard-header">
        <h1>Welcome back, {user?.first_name || user?.username}!</h1>
        <p className="dashboard-subtitle">Here's what's happening with your projects today.</p>
      </div>

      <div className="stat-grid">
        <StatCard
          type="green"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
          value={projects.length}
          label="Active Projects"
          trend="up"
          trendValue="12%"
        />
        <StatCard
          type="teal"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          value="14"
          label="Completed Tasks"
          trend="up"
          trendValue="8%"
        />
        <StatCard
          type="purple"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          value="5"
          label="Team Members"
          trend="up"
          trendValue="3%"
        />
        <StatCard
          type="gold"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          value={invitations.length}
          label="Pending Invitations"
          trend="new"
          trendValue="2 new"
        />
      </div>

      {invitations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending Invitations</span>
            <Link to="/student/invitations" className="card-action">View all →</Link>
          </div>
          <div className="card-content">
            <div className="alert info" style={{ marginBottom: 0 }}>
              <div className="alert-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="alert-content">
                <div className="alert-title">You have {invitations.length} pending invitation(s)</div>
                <div className="alert-msg">Check your invitations to join new projects.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">My Projects</span>
          <Link to="/student/projects/create" className="btn btn-primary btn-sm">+ Create New</Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="fa-regular fa-folder-open"></i></div>
            <p>No projects yet. <Link to="/student/projects/create">Create your first project</Link></p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/student/projects/${project.id}`}
                className="project-card"
              >
                <h3>{project.title}</h3>
                <p className="project-description">{project.description?.substring(0, 100)}...</p>
                <div className="project-meta">
                  <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                  <span className="badge badge-member">In Progress</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {projects.length > 4 && (
          <div className="card-footer">
            <Link to="/student/projects" className="card-action">View all projects →</Link>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Project Progress</span>
          <span className="card-action">Details</span>
        </div>
        <div className="progress-section">
          <ProgressBar label="Dissertation" percentage={68} color="var(--green-accent)" />
          <ProgressBar label="Stats Project" percentage={45} color="var(--purple)" />
          <ProgressBar label="Group Report" percentage={90} color="var(--green-completed)" />
          <ProgressBar label="Lab Circuits" percentage={22} color="var(--gold)" />
          
          <div style={{ marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green-completed)' }}></div>Done</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green-accent)' }}></div>Active</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--gold)' }}></div>Due soon</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--red)' }}></div>Overdue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};