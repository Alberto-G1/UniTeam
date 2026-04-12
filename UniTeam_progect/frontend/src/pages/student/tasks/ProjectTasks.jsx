import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, taskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ToastContainer';
import Modal from '../../../components/Modal';
import './TaskBoard.css';

const STATUS_COLUMNS = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'DONE', label: 'Done' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const emptyTaskForm = {
  title: '',
  description: '',
  section_id: '',
  assigned_to_id: '',
  priority: 'MEDIUM',
  deadline: '',
  estimated_hours: '',
  tags: '',
};

const emptySectionForm = {
  name: '',
  order: 0,
};

const getTaskSectionLabel = (task) => task?.section_name || task?.section?.name || 'General';

const getUserDisplayName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Unknown User';
};

const getStatusLabel = (status) => STATUS_COLUMNS.find((column) => column.key === status)?.label || status;

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const percentBadgeClass = (progress) => {
  if (progress >= 100) return 'progress-high';
  if (progress >= 60) return 'progress-medium';
  if (progress >= 25) return 'progress-low';
  return 'progress-muted';
};

export const ProjectTasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState(null);
  const [project, setProject] = useState(null);
  const [viewMode, setViewMode] = useState('board');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [sectionForm, setSectionForm] = useState(emptySectionForm);

  useEffect(() => {
    loadBoard();
  }, [id]);

  const tasks = board?.tasks || [];
  const sections = board?.sections || [];
  const members = board?.members || [];

  const isLecturerRoute = location.pathname.startsWith('/lecturer/');
  const projectPath = isLecturerRoute ? `/lecturer/projects/${id}` : `/student/projects/${id}`;
  const taskDetailsPath = (taskId) =>
    isLecturerRoute
      ? `/lecturer/projects/${id}/tasks/${taskId}`
      : `/student/projects/${id}/tasks/${taskId}`;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
      const searchText = `${task.title || ''} ${task.description || ''} ${getTaskSectionLabel(task)} ${task.assigned_to ? getUserDisplayName(task.assigned_to) : ''}`.toLowerCase();
      const matchesSearch = !taskSearch || searchText.includes(taskSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, filterStatus, taskSearch]);

  const groupedTasks = useMemo(() => {
    return STATUS_COLUMNS.reduce((accumulator, column) => {
      accumulator[column.key] = filteredTasks.filter((task) => task.status === column.key);
      return accumulator;
    }, {});
  }, [filteredTasks]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const [boardData, projectData] = await Promise.all([
        taskAPI.getBoard(id),
        projectsAPI.get(id),
      ]);
      setBoard(boardData || {});
      setProject(projectData);
    } catch (error) {
      showToast('error', 'Load Failed', 'Could not load the task board');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await taskAPI.createTask({
        project_id: Number(id),
        title: taskForm.title,
        description: taskForm.description,
        section_id: taskForm.section_id || null,
        assigned_to_id: taskForm.assigned_to_id || null,
        priority: taskForm.priority,
        deadline: taskForm.deadline,
        estimated_hours: taskForm.estimated_hours || null,
        tags: taskForm.tags,
      });
      showToast('success', 'Task Created', 'Task was added to the board');
      setTaskModalOpen(false);
      setTaskForm(emptyTaskForm);
      await loadBoard();
    } catch (error) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || 'Could not create task';
      showToast('error', 'Create Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSection = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await taskAPI.createSection({
        project: Number(id),
        name: sectionForm.name,
        order: Number(sectionForm.order) || 0,
      });
      showToast('success', 'Section Created', 'Task section added to the board');
      setSectionModalOpen(false);
      setSectionForm(emptySectionForm);
      await loadBoard();
    } catch (error) {
      const message = error?.response?.data?.detail || error?.response?.data?.error || 'Could not create section';
      showToast('error', 'Create Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const currentMembership = members.find((member) => member.user?.id === user?.id);
  const canEditBoard = ['LEADER', 'CO_LEADER'].includes(currentMembership?.role || '') || user?.role === 'ADMIN';

  if (loading) {
    return <div className="task-board-page loading-state">Loading task board...</div>;
  }

  return (
    <div className="task-board-page">
      <div className="task-board-hero surface">
        <div>
          <p className="task-board-kicker">Project tasks</p>
          <h1>{project?.title || 'Project Tasks'}</h1>
          <p className="task-board-subtitle">
            {project?.task_count || 0} tasks tracked · {project?.task_progress_percentage || 0}% complete
          </p>
        </div>
        <div className="task-board-actions">
          <Link to={projectPath} className="btn btn-secondary">Back to Project</Link>
          {canEditBoard && (
            <>
              <button className="btn btn-secondary" onClick={() => setSectionModalOpen(true)} disabled={busy}>Add Section</button>
              <button className="btn btn-primary" onClick={() => setTaskModalOpen(true)} disabled={busy}>New Task</button>
            </>
          )}
        </div>
      </div>

      <div className="task-board-toolbar surface">
        <div className="toolbar-group">
          <button className={`chip ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}>Kanban</button>
          <button className={`chip ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
        </div>
        <div className="toolbar-group">
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUS_COLUMNS.map((column) => (
              <option key={column.key} value={column.key}>{column.label}</option>
            ))}
          </select>
          <input
            className="task-search"
            value={taskSearch}
            onChange={(event) => setTaskSearch(event.target.value)}
            placeholder="Search tasks, sections, or assignees"
          />
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="task-board-columns">
          {STATUS_COLUMNS.map((column) => (
            <section key={column.key} className="task-column surface">
              <div className="task-column-header">
                <h2>{column.label}</h2>
                <span>{groupedTasks[column.key]?.length || 0}</span>
              </div>
              <div className="task-column-body">
                {(groupedTasks[column.key] || []).map((task) => (
                  <button key={task.id} type="button" className="task-card" onClick={() => navigate(taskDetailsPath(task.id))}>
                    <div className="task-card-top">
                      <span className={`task-priority priority-${String(task.priority || '').toLowerCase()}`}>{task.priority}</span>
                      {task.is_overdue && <span className="task-pill danger">Overdue</span>}
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.description || 'No description provided.'}</p>
                    <div className="task-card-meta">
                      <span>{getTaskSectionLabel(task)}</span>
                      <span>{task.assigned_to ? getUserDisplayName(task.assigned_to) : 'Unassigned'}</span>
                    </div>
                    <div className="task-progress-row">
                      <div className={`task-progress ${percentBadgeClass(task.progress_percentage || 0)}`}>
                        <span style={{ width: `${task.progress_percentage || 0}%` }} />
                      </div>
                      <span>{task.progress_percentage || 0}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="task-list surface">
          <div className="task-list-header">
            <span>Task</span>
            <span>Status</span>
            <span>Section</span>
            <span>Assignee</span>
            <span>Deadline</span>
          </div>
          {filteredTasks.map((task) => (
            <button key={task.id} type="button" className="task-list-row" onClick={() => navigate(taskDetailsPath(task.id))}>
              <span className="task-list-title">
                <strong>{task.title}</strong>
                <small>{task.description || 'No description'}</small>
              </span>
              <span>{getStatusLabel(task.status)}</span>
              <span>{getTaskSectionLabel(task)}</span>
              <span>{task.assigned_to ? getUserDisplayName(task.assigned_to) : 'Unassigned'}</span>
              <span>{formatDateTime(task.deadline)}</span>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Create Task"
        subtitle="Add a new project task"
        onConfirm={handleCreateTask}
        confirmText="Create Task"
      >
        <form className="task-form" onSubmit={handleCreateTask}>
          <label>
            Title
            <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} rows="4" />
          </label>
          <div className="task-form-grid">
            <label>
              Section
              <select value={taskForm.section_id} onChange={(event) => setTaskForm({ ...taskForm, section_id: event.target.value })}>
                <option value="">General</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </label>
            <label>
              Assignee
              <select value={taskForm.assigned_to_id} onChange={(event) => setTaskForm({ ...taskForm, assigned_to_id: event.target.value })}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user?.id} value={member.user?.id}>{getUserDisplayName(member.user)}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </label>
            <label>
              Deadline
              <input type="datetime-local" value={taskForm.deadline} onChange={(event) => setTaskForm({ ...taskForm, deadline: event.target.value })} required />
            </label>
            <label>
              Estimated Hours
              <input type="number" min="0" step="0.5" value={taskForm.estimated_hours} onChange={(event) => setTaskForm({ ...taskForm, estimated_hours: event.target.value })} />
            </label>
            <label>
              Tags
              <input value={taskForm.tags} onChange={(event) => setTaskForm({ ...taskForm, tags: event.target.value })} placeholder="research, frontend, api" />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title="Create Section"
        subtitle="Organize tasks into a new section"
        onConfirm={handleCreateSection}
        confirmText="Create Section"
      >
        <form className="task-form" onSubmit={handleCreateSection}>
          <label>
            Name
            <input value={sectionForm.name} onChange={(event) => setSectionForm({ ...sectionForm, name: event.target.value })} required />
          </label>
          <label>
            Order
            <input type="number" value={sectionForm.order} onChange={(event) => setSectionForm({ ...sectionForm, order: event.target.value })} />
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectTasks;
