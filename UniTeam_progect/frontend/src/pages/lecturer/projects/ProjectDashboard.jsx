import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import '../../student/projects/ProjectForms.css';

export const ProjectDashboard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const [projectRes, analyticsRes, timelineRes] = await Promise.all([
          projectsAPI.get(id),
          projectsAPI.getProjectAnalytics(id),
          projectsAPI.getProjectActivityTimeline(id, { type: 'ALL' }),
        ]);
        setProject(projectRes);
        setAnalytics(analyticsRes || null);
        setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-dashboard-wrapper">
      <div className="project-header surface">
        <div className="header-content">
          <h1>{project.title}</h1>
          <p className="project-status">Read-only supervisor view</p>
        </div>
        <div className="header-actions">
          <Link to={`/lecturer/files?project=${id}`} className="btn btn-secondary">Open File Library</Link>
          <Link to={`/lecturer/calendar?project=${id}`} className="btn btn-secondary">Open Project Calendar</Link>
        </div>
      </div>

      <div className="project-content">
        {analytics?.project_health && (
          <div className="project-section surface">
            <h2>Project Health</h2>
            <p>{analytics.project_health.interpretation}</p>
            <div className="quick-stats-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
              <div className="quick-stat-card"><p className="quick-stat-label">Progress</p><p className="quick-stat-value">{analytics.project_health.overall_progress_percentage}%</p></div>
              <div className="quick-stat-card"><p className="quick-stat-label">Days Remaining</p><p className="quick-stat-value">{analytics.project_health.time_remaining_days}</p></div>
              <div className="quick-stat-card"><p className="quick-stat-label">Overdue</p><p className="quick-stat-value">{analytics.project_health.tasks_health.overdue}</p></div>
              <div className="quick-stat-card"><p className="quick-stat-label">Blocked</p><p className="quick-stat-value">{analytics.project_health.tasks_health.blocked}</p></div>
            </div>
          </div>
        )}

        {analytics?.team_contribution?.length > 0 && (
          <div className="project-section surface">
            <h2>Team Contribution</h2>
            <div className="team-grid">
              {analytics.team_contribution.map((item) => (
                <div key={item.membership_id} className="member-card">
                  <h3>{item.member?.first_name || item.member?.username}</h3>
                  <p className="email">Assigned/Done/Overdue: {item.tasks_assigned}/{item.tasks_completed}/{item.tasks_overdue}</p>
                  <p className="email">On-time: {item.on_time_completion_rate}%</p>
                  <p className="email">Active Tasks: {item.active_tasks}</p>
                  <p className="email">Health: {item.health_badge}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analytics?.workload_distribution?.length > 0 && (
          <div className="project-section surface">
            <h2>Workload Distribution</h2>
            <div className="team-grid">
              {analytics.workload_distribution.map((row) => (
                <div key={row.member?.id} className="member-card">
                  <h3>{row.member?.first_name || row.member?.username}</h3>
                  <p className="email">Done: {row.done}</p>
                  <p className="email">In Progress: {row.in_progress}</p>
                  <p className="email">To-Do: {row.todo}</p>
                  <p className="email">Overdue: {row.overdue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="project-section surface">
          <h2>Project Activity Timeline</h2>
          <div className="team-grid">
            {timeline.slice(0, 30).map((item, index) => (
              <div key={`${item.type}-${item.timestamp}-${index}`} className="member-card">
                <h3>{item.type}</h3>
                <p>{item.label}</p>
                <p className="email">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
