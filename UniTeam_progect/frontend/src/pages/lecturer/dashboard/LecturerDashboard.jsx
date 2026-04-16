import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import { useAuth } from '../../../context/AuthContext';
import './LecturerDashboard.css';

const dateFormatter = new Intl.DateTimeFormat('en-NZ', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const asList = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

export const LecturerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('submission_deadline');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await projectsAPI.getLecturerDashboard();
        setPayload(data);
      } catch (error) {
        showToast('error', 'Lecturer Dashboard', 'Unable to load lecturer analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [showToast]);

  const rows = asList(payload?.comparison_rows);
  const sortedRows = useMemo(() => {
    const next = [...rows];
    if (sortKey === 'progress') {
      return next.sort((a, b) => (b.overall_progress_percentage || 0) - (a.overall_progress_percentage || 0));
    }
    if (sortKey === 'overdue') {
      return next.sort((a, b) => (b.tasks?.overdue || 0) - (a.tasks?.overdue || 0));
    }
    if (sortKey === 'activity') {
      return next.sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0));
    }
    return next.sort((a, b) => new Date(a.submission_deadline || 0) - new Date(b.submission_deadline || 0));
  }, [rows, sortKey]);

  if (loading) {
    return <div className="phase6-loading">Loading dashboard...</div>;
  }

  return (
    <div className="phase6-lecturer-dashboard">
      <header className="phase6-lecturer-hero">
        <h1>Lecturer Monitoring Dashboard</h1>
        <p>{user?.first_name || user?.username}, track every linked group in one place.</p>
      </header>

      <section className="phase6-panel">
        <h2>At-Risk Groups</h2>
        {payload?.all_on_track ? (
          <div className="phase6-all-good">All groups are on track.</div>
        ) : (
          <div className="phase6-alerts-grid">
            {asList(payload?.alerts).map((alert) => (
              <article key={alert.id} className="phase6-alert-card">
                <strong>{alert.project?.title}</strong>
                <p>{alert.alert_message}</p>
                <small>Triggered {dateFormatter.format(new Date(alert.triggered_at))}</small>
                <Link to={`/lecturer/projects/${alert.project?.id}`}>Open project</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="phase6-panel">
        <div className="phase6-panel-head">
          <h2>Group Progress Comparison</h2>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="submission_deadline">Sort: Deadline</option>
            <option value="progress">Sort: Progress</option>
            <option value="overdue">Sort: Overdue</option>
            <option value="activity">Sort: Last activity</option>
          </select>
        </div>
        <div className="phase6-table-wrap">
          <table className="phase6-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Members</th>
                <th>Progress</th>
                <th>Tasks (Total/Done/Overdue)</th>
                <th>Files (Total/Final)</th>
                <th>Last Activity</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.project_id}>
                  <td><Link to={`/lecturer/projects/${row.project_id}`}>{row.project_name}</Link></td>
                  <td>{row.members_count}</td>
                  <td>{row.overall_progress_percentage}%</td>
                  <td>{row.tasks?.total}/{row.tasks?.done}/{row.tasks?.overdue}</td>
                  <td>{row.files?.total}/{row.files?.finals_uploaded}</td>
                  <td>{row.last_activity ? dateFormatter.format(new Date(row.last_activity)) : 'N/A'}</td>
                  <td>{row.submission_deadline}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="phase6-panel">
        <h2>Submission Readiness</h2>
        <div className="phase6-readiness-grid">
          {asList(payload?.submission_readiness).map((item) => (
            <article key={item.project_id} className="phase6-readiness-card">
              <header>
                <strong>{item.project_name}</strong>
                <span className={item.is_submission_ready ? 'phase6-good' : 'phase6-risk'}>
                  {item.is_submission_ready ? 'Submission Ready' : 'Missing Criteria'}
                </span>
              </header>
              <ul>
                {asList(item.checks).map((check) => (
                  <li key={`${item.project_id}-${check.item_type}`}>
                    <span>{check.is_passed ? 'OK' : 'Missing'}</span> {check.label}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LecturerDashboard;
