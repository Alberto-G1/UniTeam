import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectTemplatesAPI } from '../../../services/api';
import './Templates.css';

export const TemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await projectTemplatesAPI.list();
      const list = response?.results || response || [];
      setTemplates(list);
    } catch (err) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await projectTemplatesAPI.delete(id);
        setTemplates(t => t.filter(x => x.id !== id));
      } catch (err) {
        setError('Failed to delete template');
      }
    }
  };

  if (loading) return <div className="loading">Loading templates...</div>;

  return (
    <div className="templates-wrapper">
      <div className="templates-header surface">
        <h1>Project Templates</h1>
        <Link to="/lecturer/templates/create" className="btn btn-primary">
          Create Template
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {templates.length > 0 ? (
        <div className="templates-grid">
          {templates.map(t => (
            <div key={t.id} className="template-card surface">
              <h3>{t.title}</h3>
              <p className="description">{t.description?.substring(0, 100)}...</p>
              <p className="milestone-count">
                Milestones: {t.milestone_templates?.length || 0}
              </p>
              <div className="template-actions">
                <Link
                  to={`/lecturer/templates/${t.id}`}
                  className="btn btn-primary"
                >
                  View
                </Link>
                <Link
                  to={`/lecturer/templates/${t.id}/edit`}
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No templates created yet.</p>
          <Link to="/lecturer/templates/create" className="btn btn-primary">
            Create Your First Template
          </Link>
        </div>
      )}
    </div>
  );
};

export default TemplateList;
