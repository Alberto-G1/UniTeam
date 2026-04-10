import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestonesAPI, projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import './ProjectForms.css';

export const MilestoneForm = () => {
  const { id, milestoneId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!milestoneId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [milestone, setMilestone] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'PENDING',
  });

  useEffect(() => {
    if (isEdit) {
      loadMilestone();
    }
  }, [milestoneId]);

  const loadMilestone = async () => {
    try {
      const allMilestones = await projectsAPI.getMilestones(id);
      const current = (allMilestones || []).find((m) => String(m.id) === String(milestoneId));
      if (!current) {
        throw new Error('Milestone not found');
      }
      setMilestone(current);
      setFormData({
        title: current.title,
        description: current.description,
        due_date: current.due_date,
        status: current.status,
      });
    } catch (err) {
      setError('Failed to load milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        project: Number(id),
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        status: formData.status,
      };

      if (isEdit) {
        await milestonesAPI.update(milestoneId, payload);
      } else {
        await milestonesAPI.create(payload);
      }
      showToast('success', 'Saved', 'Milestone saved successfully');
      navigate(`/student/projects/${id}`, { state: { message: 'Milestone saved successfully' } });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="milestone-form-wrapper">
      <div className="form-header surface">
        <h1>{isEdit ? 'Edit Milestone' : 'Create Milestone'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="milestone-form surface">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Milestone title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What needs to be accomplished?"
            rows="4"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="due_date">Due Date *</label>
            <input
              id="due_date"
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Milestone' : 'Create Milestone'}
          </button>
          <Link to={`/student/projects/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default MilestoneForm;
