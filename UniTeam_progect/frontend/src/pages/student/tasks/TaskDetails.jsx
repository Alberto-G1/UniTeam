import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectsAPI, projectFilesAPI, taskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/ToastContainer';
import Modal from '../../../components/Modal';
import ConfirmModal from '../../../components/ConfirmModal';
import './TaskBoard.css';

const STATUS_COLUMNS = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'DONE', label: 'Done' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  UNDER_REVIEW: 'Under Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

const getStatusLabel = (status) => STATUS_COLUMNS.find((column) => column.key === status)?.label || status;
const getTaskSectionLabel = (task) => task?.section_name || task?.section?.name || 'General';

const getUserDisplayName = (user) => {
  if (!user) return 'Unassigned';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Unknown User';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const renderStatusTrack = (status) => {
  const key = String(status || '').toLowerCase();
  return (
    <div className="status-sequence" role="status" aria-label={`Task status is ${STATUS_LABELS[status] || status}`}>
      <span className={`status-current-badge ${key}`}>{STATUS_LABELS[status] || status}</span>
    </div>
  );
};

export const TaskDetails = () => {
  const { id, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [commentForm, setCommentForm] = useState({ content: '' });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', action: null, type: 'warning' });
  const [subtaskForm, setSubtaskForm] = useState({ description: '' });
  const [reassignForm, setReassignForm] = useState({ assigned_to_id: '', reason: '' });
  const [cancelForm, setCancelForm] = useState({ reason: '' });

  const isLecturerRoute = location.pathname.startsWith('/lecturer/');
  const boardPath = isLecturerRoute ? `/lecturer/projects/${id}/tasks` : `/student/projects/${id}/tasks`;
  const projectPath = isLecturerRoute ? `/lecturer/projects/${id}` : `/student/projects/${id}`;
  const filesPath = isLecturerRoute ? '/lecturer/files' : '/student/files';

  useEffect(() => {
    loadData();
  }, [id, taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskData, boardData, projectData] = await Promise.all([
        taskAPI.getTask(taskId),
        taskAPI.getBoard(id),
        projectsAPI.get(id),
      ]);
      setTask(taskData);
      setMembers(boardData?.members || []);
      setProject(projectData);
      setReassignForm({
        assigned_to_id: taskData?.assigned_to?.id ? String(taskData.assigned_to.id) : '',
        reason: '',
      });
    } catch (error) {
      showToast('error', 'Load Failed', 'Could not load task details');
      navigate(boardPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadLinkedFiles = async () => {
      if (!project?.id || !task?.id) {
        setProjectFiles([]);
        return;
      }

      try {
        const filesData = await projectFilesAPI.listFiles({ project: project.id, include_deleted: '0' });
        const list = Array.isArray(filesData) ? filesData : filesData?.results || [];
        setProjectFiles(list.filter((file) => file.linked_task?.id === task.id));
      } catch (error) {
        setProjectFiles([]);
      }
    };

    loadLinkedFiles();
  }, [project?.id, task?.id]);

  const openConfirm = (payload) => {
    setConfirmState({
      isOpen: true,
      title: payload.title,
      message: payload.message,
      action: payload.action,
      type: payload.type || 'warning',
    });
  };

  const closeConfirm = () => {
    setConfirmState({ isOpen: false, title: '', message: '', action: null, type: 'warning' });
  };

  const handleConfirm = async () => {
    if (typeof confirmState.action === 'function') {
      await confirmState.action();
    }
    closeConfirm();
  };

  const refreshTask = async () => {
    const updated = await taskAPI.getTask(taskId);
    setTask(updated);
  };

  const updateTaskStatus = async (status) => {
    if (!task) return;
    setBusy(true);
    try {
      await taskAPI.setStatus(task.id, { status });
      showToast('success', 'Task Updated', `Task moved to ${getStatusLabel(status)}`);
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not update task status';
      showToast('error', 'Update Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!task || !commentForm.content.trim()) return;
    setBusy(true);
    try {
      await taskAPI.createComment({ task: task.id, content: commentForm.content.trim() });
      setCommentForm({ content: '' });
      showToast('success', 'Comment Added', 'Your comment was posted');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not add comment';
      showToast('error', 'Comment Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleUploadAttachment = async (event) => {
    event.preventDefault();
    if (!task || !attachmentFile) return;
    const formData = new FormData();
    formData.append('task', task.id);
    formData.append('file', attachmentFile);

    setBusy(true);
    try {
      await taskAPI.uploadAttachment(formData);
      setAttachmentFile(null);
      showToast('success', 'Attachment Added', 'File uploaded successfully');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not upload attachment';
      showToast('error', 'Upload Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handlePromoteAttachment = async (attachment) => {
    if (!attachment?.id || !task) return;
    setBusy(true);
    try {
      await taskAPI.promoteAttachmentToLibrary(attachment.id, {
        display_name: attachment.file_name,
        version_note: 'Promoted from task attachment',
      });
      showToast('success', 'Promoted to File Library', 'Attachment is now available in the project file library and linked to this task.');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not promote attachment';
      showToast('error', 'Promotion Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSubtask = async () => {
    if (!task || !subtaskForm.description.trim()) {
      showToast('error', 'Missing Description', 'Please enter subtask details');
      return;
    }

    setBusy(true);
    try {
      await taskAPI.addSubtask(task.id, { description: subtaskForm.description.trim() });
      setSubtaskModalOpen(false);
      setSubtaskForm({ description: '' });
      showToast('success', 'Subtask Added', 'Subtask has been added to this task');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not add subtask';
      showToast('error', 'Subtask Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleReassign = async () => {
    if (!task) return;
    if (!reassignForm.assigned_to_id) {
      showToast('error', 'Missing Assignee', 'Please choose a team member');
      return;
    }
    if (!reassignForm.reason.trim()) {
      showToast('error', 'Missing Reason', 'Please provide a reason for reassignment');
      return;
    }

    setBusy(true);
    try {
      await taskAPI.reassign(task.id, {
        assigned_to_id: Number(reassignForm.assigned_to_id),
        reason: reassignForm.reason.trim(),
      });
      setReassignModalOpen(false);
      showToast('success', 'Task Reassigned', 'Task ownership updated');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not reassign task';
      showToast('error', 'Reassign Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelTask = async () => {
    if (!task) return;
    setBusy(true);
    try {
      await taskAPI.cancel(task.id, { reason: cancelForm.reason.trim() });
      setCancelModalOpen(false);
      setCancelForm({ reason: '' });
      showToast('success', 'Task Cancelled', 'Task has been marked as cancelled');
      await refreshTask();
    } catch (error) {
      const message = error?.response?.data?.error || 'Could not cancel task';
      showToast('error', 'Cancel Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const currentMembership = useMemo(
    () => members.find((member) => member.user?.id === user?.id),
    [members, user?.id]
  );
  const canEditBoard = ['LEADER', 'CO_LEADER'].includes(currentMembership?.role || '') || user?.role === 'ADMIN';
  const isAssignee = task?.assigned_to?.id === user?.id;

  const renderStatusActions = () => {
    if (!task) return null;

    if (canEditBoard) {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn"
            title="Move to To Do"
            aria-label="Move to To Do"
            onClick={() => updateTaskStatus('TODO')}
            disabled={busy || task.status === 'TODO'}
          >
            <i className="fa-solid fa-rotate-left"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn start"
            title="Move to In Progress"
            aria-label="Move to In Progress"
            onClick={() => updateTaskStatus('IN_PROGRESS')}
            disabled={busy || task.status === 'IN_PROGRESS'}
          >
            <i className="fa-solid fa-play"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn submit"
            title="Move to Under Review"
            aria-label="Move to Under Review"
            onClick={() => updateTaskStatus('UNDER_REVIEW')}
            disabled={busy || task.status === 'UNDER_REVIEW'}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn done"
            title="Move to Done"
            aria-label="Move to Done"
            onClick={() => updateTaskStatus('DONE')}
            disabled={busy || task.status === 'DONE'}
          >
            <i className="fa-solid fa-circle-check"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn cancel"
            title="Cancel task"
            aria-label="Cancel task"
            onClick={() => {
              setCancelForm({ reason: '' });
              setCancelModalOpen(true);
            }}
            disabled={busy}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      );
    }

    if (isAssignee && task.status === 'TODO') {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn start"
            title="Start task"
            aria-label="Start task"
            onClick={() => updateTaskStatus('IN_PROGRESS')}
            disabled={busy}
          >
            <i className="fa-solid fa-play"></i>
          </button>
          <button
            type="button"
            className="status-icon-btn cancel"
            title="Cancel task"
            aria-label="Cancel task"
            onClick={() => {
              setCancelForm({ reason: '' });
              setCancelModalOpen(true);
            }}
            disabled={busy}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      );
    }

    if (isAssignee && task.status === 'IN_PROGRESS') {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn submit"
            title="Submit for review"
            aria-label="Submit for review"
            onClick={() => updateTaskStatus('UNDER_REVIEW')}
            disabled={busy}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      );
    }

    if (canEditBoard && task.status === 'UNDER_REVIEW') {
      return (
        <div className="status-action-group">
          <button
            type="button"
            className="status-icon-btn done"
            title="Mark task as done"
            aria-label="Mark task as done"
            onClick={() => updateTaskStatus('DONE')}
            disabled={busy}
          >
            <i className="fa-solid fa-circle-check"></i>
          </button>
        </div>
      );
    }

    return <span className="status-no-action">No actions available</span>;
  };

  if (loading) {
    return <div className="task-board-page loading-state">Loading task details...</div>;
  }

  if (!task) {
    return <div className="task-board-page empty-state">Task not found.</div>;
  }

  return (
    <div className="task-board-page task-detail-page">
      <div className="task-board-hero surface">
        <div>
          <p className="task-board-kicker">Task details</p>
          <h1>{task.title}</h1>
          <p className="task-board-subtitle">
            {project?.title || 'Project'} · {getTaskSectionLabel(task)}
          </p>
        </div>
        <div className="task-board-actions">
          <Link to={projectPath} className="btn btn-secondary">Project</Link>
          <Link to={boardPath} className="btn btn-secondary">Back to Board</Link>
        </div>
      </div>

      <div className="task-detail-summary surface">
        <p className={`task-priority priority-${String(task.priority || '').toLowerCase()}`}>{task.priority}</p>
        <p>{task.description || 'No description provided.'}</p>
        <div className="task-detail-grid">
          <div><span>Status</span><strong>{getStatusLabel(task.status)}</strong></div>
          <div><span>Assignee</span><strong>{task.assigned_to ? getUserDisplayName(task.assigned_to) : 'Unassigned'}</strong></div>
          <div><span>Deadline</span><strong>{formatDateTime(task.deadline)}</strong></div>
          <div><span>Progress</span><strong>{task.progress_percentage || 0}%</strong></div>
        </div>
        <div className="task-detail-actions">
          {renderStatusTrack(task.status)}
          {renderStatusActions()}
          {canEditBoard && (
            <button type="button" className="btn btn-secondary" onClick={() => setReassignModalOpen(true)} disabled={busy}>Reassign</button>
          )}
        </div>
      </div>

      <div className="task-detail-panels detail-page-panels">
        <section>
          <h4>Subtasks</h4>
          <ul className="task-subtask-list">
            {(task.subtasks || []).map((subtask) => (
              <li key={subtask.id} className={subtask.is_completed ? 'done' : ''}>
                <span>{subtask.description}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary" onClick={() => setSubtaskModalOpen(true)} disabled={busy}>Add Subtask</button>
        </section>

        <section>
          <h4>Comments</h4>
          <form className="task-inline-form" onSubmit={handleAddComment}>
            <textarea value={commentForm.content} onChange={(event) => setCommentForm({ content: event.target.value })} placeholder="Write a comment or mention @someone" rows="3" />
            <button type="submit" className="btn btn-primary" disabled={busy}>Post Comment</button>
          </form>
          <div className="task-comment-list">
            {(task.comments || []).map((comment) => (
              <article key={comment.id} className="task-comment">
                <strong>{getUserDisplayName(comment.author)}</strong>
                <p>{comment.content}</p>
                <small>{formatDateTime(comment.created_at)}</small>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h4>Attachments</h4>
          <form className="task-inline-form" onSubmit={handleUploadAttachment}>
            <input type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} />
            <button type="submit" className="btn btn-primary" disabled={busy || !attachmentFile}>Upload</button>
          </form>
          <div className="task-comment-list">
            {(task.attachments || []).map((attachment) => (
              <article key={attachment.id} className="task-comment">
                <strong>{attachment.file_name}</strong>
                <p>{attachment.file_size ? `${attachment.file_size} bytes` : 'File attachment'}</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {attachment.file_url && <a href={attachment.file_url} target="_blank" rel="noreferrer">Open file</a>}
                  {canEditBoard && (
                    <button type="button" className="btn btn-secondary" onClick={() => handlePromoteAttachment(attachment)} disabled={busy}>
                      Promote to File Library
                    </button>
                  )}
                </div>
              </article>
            ))}
            {projectFiles.map((file) => (
              <article key={`library-${file.id}`} className="task-comment">
                <strong>{file.display_name} · Library File</strong>
                <p>{file.folder?.name || 'General'} · v{file.current_version_number}</p>
                {file.current_file_url && <a href={file.current_file_url} target="_blank" rel="noreferrer">Open file</a>}
              </article>
            ))}
          </div>
        </section>

        <section>
          <Link to={`${filesPath}?project=${project?.id || id}`}>Open project file library</Link>
        </section>

        <section>
          <h4>Activity Log</h4>
          <div className="task-comment-list">
            {(task.activity_logs || []).map((entry) => (
              <article key={entry.id} className="task-comment">
                <strong>{entry.action_type}</strong>
                <p>{entry.reason || `${entry.old_value || ''} -> ${entry.new_value || ''}`}</p>
                <small>{formatDateTime(entry.created_at)}</small>
              </article>
            ))}
          </div>
        </section>
      </div>

      <Modal
        isOpen={subtaskModalOpen}
        onClose={() => setSubtaskModalOpen(false)}
        title="Add Subtask"
        subtitle="Create a child task for this item"
        onConfirm={handleCreateSubtask}
        confirmText="Add Subtask"
      >
        <form className="task-form" onSubmit={(event) => {
          event.preventDefault();
          handleCreateSubtask();
        }}>
          <label>
            Description
            <textarea
              value={subtaskForm.description}
              onChange={(event) => setSubtaskForm({ description: event.target.value })}
              rows="4"
              placeholder="Describe the subtask..."
              required
            />
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Reassign Task"
        subtitle="Select the next owner from project members"
        onConfirm={handleReassign}
        confirmText="Reassign"
      >
        <form className="task-form" onSubmit={(event) => {
          event.preventDefault();
          handleReassign();
        }}>
          <label>
            Assign To
            <select
              value={reassignForm.assigned_to_id}
              onChange={(event) => setReassignForm((prev) => ({ ...prev, assigned_to_id: event.target.value }))}
              required
            >
              <option value="">Select a team member</option>
              {members
                .filter((member) => member.user?.id)
                .map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {getUserDisplayName(member.user)} ({member.role})
                  </option>
                ))}
            </select>
          </label>
          <label>
            Reason
            <textarea
              value={reassignForm.reason}
              onChange={(event) => setReassignForm((prev) => ({ ...prev, reason: event.target.value }))}
              rows="3"
              placeholder="Why is this task being reassigned?"
              required
            />
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Task"
        subtitle="Provide a reason before cancelling"
        onConfirm={() => {
          if (!cancelForm.reason.trim()) {
            showToast('error', 'Missing Reason', 'Please provide a cancellation reason');
            return;
          }
          openConfirm({
            title: 'Confirm Task Cancellation',
            message: `Cancel task "${task.title}"?`,
            type: 'danger',
            action: handleCancelTask,
          });
        }}
        confirmText="Continue"
      >
        <form className="task-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Reason
            <textarea
              value={cancelForm.reason}
              onChange={(event) => setCancelForm({ reason: event.target.value })}
              rows="4"
              placeholder="Explain why this task should be cancelled"
              required
            />
          </label>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
      />
    </div>
  );
};

export default TaskDetails;
