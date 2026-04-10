import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { milestoneTemplatesAPI, projectTemplatesAPI } from '../../../services/api';
import './Templates.css';

export const TemplateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    course_code: '',
    description: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const response = await projectTemplatesAPI.get(id);
      setFormData({
        title: response.title,
        course_code: response.course_code,
        description: response.description,
      });
      setMilestones(response.milestone_templates || []);
    } catch (err) {
      setError('Failed to load template');
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

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', order: milestones.length + 1 }]);
  };

  const removeMilestone = (index) => {
    setMilestones(m => m.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        course_code: formData.course_code,
        description: formData.description,
      };

      if (isEdit) {
        await projectTemplatesAPI.update(id, payload);
      } else {
        const created = await projectTemplatesAPI.create(payload);

        if (milestones.length > 0) {
          for (let i = 0; i < milestones.length; i += 1) {
            const m = milestones[i];
            if (!m.title?.trim()) continue;
            await milestoneTemplatesAPI.create({
              project_template: created.id,
              title: m.title,
              description: m.description || '',
              order: m.order || i + 1,
            });
          }
        }
      }
      navigate('/lecturer/templates');
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="template-form-wrapper">
      <div className="form-header surface">
        <h1>{isEdit ? 'Edit Template' : 'Create Template'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="template-form surface">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Template Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Template title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="course_code">Course Code *</label>
          <input
            id="course_code"
            type="text"
            name="course_code"
            value={formData.course_code}
            onChange={handleChange}
            placeholder="e.g., SOFTENG 350"
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
            placeholder="Describe this template..."
            rows="4"
          />
        </div>

        <div className="milestones-section">
          <h3>Milestone Templates</h3>
          {milestones.map((m, i) => (
            <div key={i} className="milestone-input-group">
              <input
                type="text"
                value={m.title}
                onChange={(e) => handleMilestoneChange(i, 'title', e.target.value)}
                placeholder="Milestone title"
              />
              <textarea
                value={m.description}
                onChange={(e) => handleMilestoneChange(i, 'description', e.target.value)}
                placeholder="Description"
                rows="2"
              />
              <button
                type="button"
                onClick={() => removeMilestone(i)}
                className="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMilestone}
            className="btn btn-secondary"
          >
            Add Milestone
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
          </button>
          <Link to="/lecturer/templates" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;
