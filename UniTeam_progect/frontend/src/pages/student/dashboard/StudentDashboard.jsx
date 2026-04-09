// src/pages/student/dashboard/StudentDashboard.jsx - COMPLETELY REDESIGNED
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI, invitationsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import StatCard from '../../../components/StatCard';
import ProgressBar from '../../../components/ProgressBar';
import Alert from '../../../components/Alert';
import './StudentDashboard.css';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    teamMembers: 0
  });

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
        
        // Calculate stats
        setStats({
          totalProjects: projectsList.length,
          completedTasks: 12, // Placeholder - would come from API
          pendingTasks: 8, // Placeholder - would come from API
          teamMembers: 5 // Placeholder - would come from API
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showToast('error', 'Error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {user?.first_name || user?.username}!</h1>
          <p>Here's what's happening with your academic journey today.</p>
        </div>
        <div className="date-display">
          <i className="fa-regular fa-calendar"></i>
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          type="green"
          icon={<i className="fa-solid fa-diagram-project"></i>}
          value={stats.totalProjects}
          label="Active Projects"
          trend="up"
          trendValue="2 new"
        />
        <StatCard
          type="teal"
          icon={<i className="fa-solid fa-check-circle"></i>}
          value={stats.completedTasks}
          label="Completed Tasks"
          trend="up"
          trendValue="+4"
        />
        <StatCard
          type="purple"
          icon={<i className="fa-solid fa-clock"></i>}
          value={stats.pendingTasks}
          label="Pending Tasks"
          trend="down"
          trendValue="-2"
        />
        <StatCard
          type="gold"
          icon={<i className="fa-solid fa-users"></i>}
          value={stats.teamMembers}
          label="Team Members"
          trend="up"
          trendValue="+1"
        />
      </div>

      {/* Pending Invitations Alert */}
      {invitations.length > 0 && (
        <Alert
          type="info"
          title={`You have ${invitations.length} pending invitation(s)`}
          message="You've been invited to join new projects. Check your invitations to collaborate with your team."
          onClose={() => {}}
        />
      )}

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* My Projects Section */}
        <div className="dashboard-card projects-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-folder-open"></i>
              <h2>My Projects</h2>
            </div>
            <Link to="/student/projects/create" className="btn-primary-sm">
              <i className="fa-solid fa-plus"></i>
              New Project
            </Link>
          </div>
          
          <div className="card-body">
            {projects.length === 0 ? (
              <div className="empty-state-small">
                <i className="fa-regular fa-folder-open"></i>
                <p>No projects yet</p>
                <Link to="/student/projects/create" className="btn-outline-sm">
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="projects-list">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/student/projects/${project.id}`}
                    className="project-item"
                  >
                    <div className="project-info">
                      <h3>{project.title}</h3>
                      <p className="project-description">
                        {project.description?.substring(0, 80)}...
                      </p>
                      <div className="project-meta">
                        <span className="meta-deadline">
                          <i className="fa-regular fa-calendar"></i>
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </span>
                        <span className="meta-progress">65% Complete</span>
                      </div>
                    </div>
                    <div className="project-progress">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {projects.length > 3 && (
            <div className="card-footer">
              <Link to="/student/projects" className="view-all-link">
                View all projects <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-chart-line"></i>
              <h2>Recent Activity</h2>
            </div>
          </div>
          
          <div className="card-body">
            <div className="activity-timeline">
              <div className="activity-item">
                <div className="activity-icon green">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div className="activity-details">
                  <p>Completed task "Research Paper Outline"</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon purple">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div className="activity-details">
                  <p>New team member joined "AI Research" project</p>
                  <span className="activity-time">Yesterday</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon gold">
                  <i className="fa-solid fa-calendar"></i>
                </div>
                <div className="activity-details">
                  <p>Deadline approaching for "Data Analysis"</p>
                  <span className="activity-time">2 days ago</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon blue">
                  <i className="fa-solid fa-comment"></i>
                </div>
                <div className="activity-details">
                  <p>New comment on "Group Presentation"</p>
                  <span className="activity-time">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        {/* Upcoming Deadlines */}
        <div className="dashboard-card deadlines-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-calendar-check"></i>
              <h2>Upcoming Deadlines</h2>
            </div>
            <Link to="/student/calendar" className="card-link">View Calendar →</Link>
          </div>
          
          <div className="card-body">
            <div className="deadlines-list">
              <div className="deadline-item urgent">
                <div className="deadline-date">
                  <span className="date-day">15</span>
                  <span className="date-month">APR</span>
                </div>
                <div className="deadline-info">
                  <h4>Final Dissertation Draft</h4>
                  <p>Computer Science Department</p>
                </div>
                <div className="deadline-badge">Due Tomorrow</div>
              </div>
              <div className="deadline-item">
                <div className="deadline-date">
                  <span className="date-day">20</span>
                  <span className="date-month">APR</span>
                </div>
                <div className="deadline-info">
                  <h4>Data Analysis Report</h4>
                  <p>Statistics Project</p>
                </div>
                <div className="deadline-badge">5 days left</div>
              </div>
              <div className="deadline-item">
                <div className="deadline-date">
                  <span className="date-day">25</span>
                  <span className="date-month">APR</span>
                </div>
                <div className="deadline-info">
                  <h4>Group Presentation</h4>
                  <p>Business Management</p>
                </div>
                <div className="deadline-badge">10 days left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="dashboard-card announcements-card">
          <div className="card-header">
            <div className="card-header-left">
              <i className="fa-solid fa-bullhorn"></i>
              <h2>Announcements</h2>
            </div>
          </div>
          
          <div className="card-body">
            <div className="announcements-list">
              <div className="announcement-item">
                <div className="announcement-badge">New</div>
                <div className="announcement-content">
                  <p>Project submission deadline extended to April 30th</p>
                  <span className="announcement-time">2 hours ago</span>
                </div>
              </div>
              <div className="announcement-item">
                <div className="announcement-badge">Update</div>
                <div className="announcement-content">
                  <p>New project template available for research proposals</p>
                  <span className="announcement-time">Yesterday</span>
                </div>
              </div>
              <div className="announcement-item">
                <div className="announcement-badge">Info</div>
                <div className="announcement-content">
                  <p>Workshop on Academic Writing - Register by Friday</p>
                  <span className="announcement-time">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};