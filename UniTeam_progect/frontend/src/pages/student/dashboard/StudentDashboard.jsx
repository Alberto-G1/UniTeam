import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import { useAuth } from '../../../context/AuthContext';
import './StudentDashboard.css';

const dateFormatter = new Intl.DateTimeFormat('en-NZ', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const overdueDays = (deadline) => {
  if (!deadline) return 0;
  const ms = Date.now() - new Date(deadline).getTime();
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
};

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectSort, setProjectSort] = useState('urgency');
  const [showCompleted, setShowCompleted] = useState(false);
  const [activityProjectFilter, setActivityProjectFilter] = useState('ALL');
  const [calendarView, setCalendarView] = useState('week');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await projectsAPI.getPersonalDashboard();
        setPayload(data);
      } catch (error) {
        showToast('error', 'Dashboard', 'Unable to load your personal dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [showToast]);

  const projects = asList(payload?.projects);
  const tasks = payload?.tasks || { overdue: [], due_soon: [], upcoming: [], completed: [] };

  const sortedProjects = useMemo(() => {
    const next = [...projects];
    if (projectSort === 'alpha') {
      return next.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    if (projectSort === 'recent') {
      return next.sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0));
    }
    return next.sort((a, b) => (a.days_remaining ?? 9999) - (b.days_remaining ?? 9999));
  }, [projects, projectSort]);

  const filteredActivity = useMemo(() => {
    const feed = asList(payload?.activity_feed);
    if (activityProjectFilter === 'ALL') return feed;
    const projectId = Number(activityProjectFilter);
    return feed.filter((item) => Number(item.project_id) === projectId);
  }, [payload?.activity_feed, activityProjectFilter]);

  const urgencyLine = payload?.summary
    ? `You have ${payload.summary.due_today_count} task(s) due today across ${payload.summary.active_project_count} project(s).`
    : 'Your personal project command center is loading.';

  if (loading) {
    return <div className="phase6-loading">Loading dashboard...</div>;
  }

  return (
    <div className="phase6-dashboard">
      <header className="phase6-hero">
        <h1>{getGreeting()}, {payload?.greeting_name || user?.first_name || user?.username}</h1>
        <p>{urgencyLine}</p>
      </header>

      <section className="phase6-panel">
        <div className="phase6-panel-head">
          <h2>My Projects</h2>
          <select value={projectSort} onChange={(event) => setProjectSort(event.target.value)}>
            <option value="urgency">Sort: Deadline urgency</option>
            <option value="recent">Sort: Recent activity</option>
            <option value="alpha">Sort: Alphabetical</option>
          </select>
        </div>
        <div className="phase6-cards-grid">
          {sortedProjects.map((project) => (
            <article key={project.id} className="phase6-project-card">
              <div className="phase6-card-top">
                <h3>{project.title}</h3>
                <span className={`phase6-deadline-${(project.deadline_status || 'GREEN').toLowerCase()}`}>
                  {project.days_remaining < 0 ? `${Math.abs(project.days_remaining)}d overdue` : `${project.days_remaining}d left`}
                </span>
              </div>
              <p>{project.course_code || 'No course code'}</p>
              <p>Role: {project.role}</p>
              <div className="phase6-ring-wrap">
                <div className="phase6-ring">{project.progress_percentage}%</div>
                <div>
                  <p>Incomplete assigned tasks: {project.assigned_incomplete_count}</p>
                  <p>Updated: {project.last_activity ? dateFormatter.format(new Date(project.last_activity)) : 'N/A'}</p>
                </div>
              </div>
              <Link to={`/student/projects/${project.id}`} className="phase6-open-btn">Open Project</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="phase6-two-col">
        <div className="phase6-panel">
          <h2>My Tasks</h2>
          <div className="phase6-task-group phase6-overdue">
            <h3>Overdue</h3>
            {asList(tasks.overdue).map((task) => (
              <Link key={task.id} to={`/student/projects/${task.project?.id}/tasks/${task.id}`} className="phase6-task-item">
                <strong>{task.title}</strong>
                <span>{task.project?.title}</span>
                <span>{overdueDays(task.deadline)} day(s) overdue</span>
              </Link>
            ))}
            {asList(tasks.overdue).length === 0 && <p>No overdue tasks.</p>}
          </div>

          <div className="phase6-task-group phase6-due-soon">
            <h3>Due Soon</h3>
            {asList(tasks.due_soon).map((task) => (
              <Link key={task.id} to={`/student/projects/${task.project?.id}/tasks/${task.id}`} className="phase6-task-item">
                <strong>{task.title}</strong>
                <span>{task.project?.title}</span>
                <span>Due {dateFormatter.format(new Date(task.deadline))}</span>
              </Link>
            ))}
            {asList(tasks.due_soon).length === 0 && <p>No tasks due in the next 3 days.</p>}
          </div>

          <div className="phase6-task-group">
            <h3>Upcoming</h3>
            {asList(tasks.upcoming).map((task) => (
              <Link key={task.id} to={`/student/projects/${task.project?.id}/tasks/${task.id}`} className="phase6-task-item">
                <strong>{task.title}</strong>
                <span>{task.project?.title}</span>
                <span>Due {dateFormatter.format(new Date(task.deadline))}</span>
              </Link>
            ))}
            {asList(tasks.upcoming).length === 0 && <p>No upcoming tasks.</p>}
          </div>

          <button type="button" className="phase6-link-btn" onClick={() => setShowCompleted((prev) => !prev)}>
            {showCompleted ? 'Hide completed tasks' : 'View completed tasks'}
          </button>
          {showCompleted && (
            <div className="phase6-task-group">
              {asList(tasks.completed).map((task) => (
                <div key={task.id} className="phase6-task-item phase6-completed">
                  <strong>{task.title}</strong>
                  <span>{task.project?.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="phase6-panel">
          <div className="phase6-panel-head">
            <h2>Recent Activity</h2>
            <select value={activityProjectFilter} onChange={(event) => setActivityProjectFilter(event.target.value)}>
              <option value="ALL">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>
          <div className="phase6-activity-list">
            {filteredActivity.map((activity, index) => (
              <article key={`${activity.type}-${activity.timestamp}-${index}`} className="phase6-activity-item">
                <p>{activity.label}</p>
                <small>{dateFormatter.format(new Date(activity.timestamp))}</small>
              </article>
            ))}
            {filteredActivity.length === 0 && <p>No activity in this filter.</p>}
          </div>
        </div>
      </section>

      <section className="phase6-two-col">
        <div className="phase6-panel">
          <div className="phase6-panel-head">
            <h2>Upcoming Deadlines Calendar</h2>
            <div className="phase6-toggle-group">
              <button type="button" onClick={() => setCalendarView('week')} className={calendarView === 'week' ? 'active' : ''}>Week</button>
              <button type="button" onClick={() => setCalendarView('month')} className={calendarView === 'month' ? 'active' : ''}>Month</button>
            </div>
          </div>
          <div className="phase6-calendar-list">
            {asList(payload?.calendar_items)
              .slice(0, calendarView === 'week' ? 12 : 24)
              .map((event) => (
                <article key={`${event.event_type}-${event.id}`} className="phase6-calendar-item">
                  <strong>{event.title}</strong>
                  <span>{dateFormatter.format(new Date(event.start_datetime))}</span>
                </article>
              ))}
          </div>
          <Link to="/student/calendar" className="phase6-link-btn">Open full calendar</Link>
        </div>

        <div className="phase6-panel">
          <div className="phase6-panel-head">
            <h2>Unread Notifications</h2>
            <Link to="/student/notifications" className="phase6-link-btn">View all</Link>
          </div>
          <div className="phase6-activity-list">
            {asList(payload?.notifications_preview).map((note) => (
              <article key={note.id} className="phase6-activity-item">
                <p>{note.title}</p>
                <small>{note.project_title || 'General'} · {dateFormatter.format(new Date(note.created_at))}</small>
              </article>
            ))}
            {asList(payload?.notifications_preview).length === 0 && <p>You're all caught up.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
