import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/apiService';
import '../../../styles/Templates.css';

export const TemplateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const response = await apiService.get(`/api/projects/templates/${id}/`);
      setTemplate(response.data);
    } catch (err) {
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await apiService.delete(`/api/projects/templates/${id}/`);
        navigate('/lecturer/templates');
      } catch (err) {
        setError('Failed to delete template');
      }
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
        {template.milestones && template.milestones.length > 0 ? (
          <div className="milestones-list">
            {template.milestones.map((m, i) => (
              <div key={i} className="milestone-item">
                <h3>{m.title}</h3>
                <p>{m.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No milestones in this template</p>
        )}
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
