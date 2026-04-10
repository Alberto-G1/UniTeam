import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { milestoneTemplatesAPI, projectTemplatesAPI } from '../../../services/api';
import './Templates.css';

export const TemplateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', order: 1 });

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const response = await projectTemplatesAPI.get(id);
      setTemplate(response);
      setNewMilestone((prev) => ({
        ...prev,
        order: (response?.milestone_templates?.length || 0) + 1,
      }));
    } catch (err) {
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await projectTemplatesAPI.delete(id);
        navigate('/lecturer/templates');
      } catch (err) {
        setError('Failed to delete template');
      }
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title.trim()) {
      setError('Milestone title is required');
      return;
    }

    try {
      await milestoneTemplatesAPI.create({
        project_template: Number(id),
        title: newMilestone.title,
        description: newMilestone.description,
        order: Number(newMilestone.order) || (template?.milestone_templates?.length || 0) + 1,
      });
      setNewMilestone({ title: '', description: '', order: (template?.milestone_templates?.length || 0) + 2 });
      await loadTemplate();
    } catch (err) {
      setError('Failed to add milestone template');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!template) return <div className="error">Template not found</div>;

  return (
    <div className="template-details-wrapper">
      <div className="template-header surface">
        <div className="header-content">
          <h1>{template.title}</h1>
          <p className="description">{template.description}</p>
        </div>
        <div className="header-actions">
          <Link
            to={`/lecturer/templates/${id}/edit`}
            className="btn btn-primary"
          >
            Edit Template
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Delete Template
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="template-content surface">
        <h2>Milestone Templates</h2>
        {template.milestone_templates && template.milestone_templates.length > 0 ? (
          <div className="milestones-list">
            {template.milestone_templates.map((m, i) => (
              <div key={i} className="milestone-item">
                <h3>{m.order}. {m.title}</h3>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No milestones in this template</p>
        )}
      </div>

      <div className="template-content surface">
        <h2>Add Milestone</h2>
        <form onSubmit={handleAddMilestone} className="template-form">
          <div className="form-group">
            <label htmlFor="milestone-title">Title *</label>
            <input
              id="milestone-title"
              type="text"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Milestone title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="milestone-description">Description</label>
            <textarea
              id="milestone-description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Milestone description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="milestone-order">Order</label>
            <input
              id="milestone-order"
              type="number"
              min="1"
              value={newMilestone.order}
              onChange={(e) => setNewMilestone((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn-primary">Add Milestone</button>
        </form>
      </div>

      <div className="template-footer surface">
        <Link to="/lecturer/templates" className="btn btn-secondary">
          Back to Templates
        </Link>
      </div>
    </div>
  );
};

export default TemplateDetails;
