import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import './TaskBoard.css';

const STATUS_FILTERS = ['ALL', 'TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED'];

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

const getDisplayName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Unknown User';
};

const getSectionName = (task) => task?.section_name || task?.section?.name || 'General';

const renderStatusTrack = (status) => {
  const key = String(status || '').toLowerCase();
  return (
    <div className="status-sequence" role="status" aria-label={`Task status is ${STATUS_LABELS[status] || status}`}>
      <span className={`status-current-badge ${key}`}>{STATUS_LABELS[status] || status}</span>
    </div>
  );
};

export const MyTasks = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.listTasks({ my_tasks: 1 });
      setTasks(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      showToast('error', 'Load Failed', 'Could not load your task list');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = status === 'ALL' || task.status === status;
      const text = `${task.title || ''} ${task.description || ''} ${getSectionName(task)} ${task.project?.title || ''}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [tasks, status, query]);

  const updateTaskStatus = async (task, nextStatus) => {
    try {
      await taskAPI.setStatus(task.id, { status: nextStatus });
      showToast('success', 'Task Updated', `Task moved to ${STATUS_LABELS[nextStatus] || nextStatus}`);
      await loadTasks();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not update task status';
      showToast('error', 'Update Failed', message);
    }
  };

  const renderActionButtons = (task) => {
    if (task.status === 'TODO') {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn start"
            title="Start task"
            aria-label="Start task"
            onClick={() => updateTaskStatus(task, 'IN_PROGRESS')}
          >
            <i className="fa-solid fa-play"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn cancel"
            title="Cancel task"
            aria-label="Cancel task"
            onClick={() => updateTaskStatus(task, 'CANCELLED')}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      );
    }

    if (task.status === 'IN_PROGRESS') {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn submit"
            title="Submit for review"
            aria-label="Submit for review"
            onClick={() => updateTaskStatus(task, 'UNDER_REVIEW')}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      );
    }

    return <span className="status-no-action">Waiting for owner</span>;
  };

  if (loading) {
    return <div className="task-board-page loading-state">Loading your tasks...</div>;
  }

  return (
    <div className="task-board-page">
      <div className="task-board-hero surface">
        <div>
          <p className="task-board-kicker">My tasks</p>
          <h1>Task Inbox</h1>
          <p className="task-board-subtitle">Track assigned work, deadlines, and status updates.</p>
        </div>
        <div className="task-board-actions">
          <button type="button" className="btn btn-secondary" onClick={loadTasks}>Refresh</button>
        </div>
      </div>

      <div className="task-board-toolbar surface">
        <div className="toolbar-group">
          {STATUS_FILTERS.map((filter) => (
            <button key={filter} className={`chip ${status === filter ? 'active' : ''}`} onClick={() => setStatus(filter)}>{filter}</button>
          ))}
        </div>
        <input className="task-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks and projects" />
      </div>

      <div className="task-list surface">
        <div className="task-list-header mytasks-header">
          <span>Task</span>
          <span>Project</span>
          <span>Section</span>
          <span>Assignee</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <article key={task.id} className="task-list-row task-list-static mytasks-row">
              <span className="task-list-title">
                <strong>{task.title}</strong>
                <small>{task.description || 'No description provided.'}</small>
              </span>
              <span><Link to={`/student/projects/${task.project?.id}`}>{task.project?.title || 'Project'}</Link></span>
              <span>{getSectionName(task)}</span>
              <span>{getDisplayName(task.assigned_to)}</span>
              <span>
                {renderStatusTrack(task.status)}
              </span>
              <span>
                {renderActionButtons(task)}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state">No tasks match the current filters.</div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
