import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import '../../../styles/Project.css';

export const CreateProject = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template_id: null,
    supervisor: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiService.get('/api/projects/templates/');
      setTemplates(response.data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = '/api/projects/create/';
      const response = await apiService.post(endpoint, formData);
      navigate(`/student/projects/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-wrapper">
      <div className="form-header surface">
        <h1>Create New Project</h1>
        <p>Start a new project or use a template</p>
      </div>

      <form onSubmit={handleSubmit} className="project-form surface">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Project Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="My Awesome Project"
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
            placeholder="Describe your project goals and scope..."
            rows="5"
          />
        </div>

        <div className="form-group">
          <label htmlFor="template_id">Use Template (Optional)</label>
          <select
            id="template_id"
            name="template_id"
            value={formData.template_id || ''}
            onChange={handleChange}
          >
            <option value="">--- No Template ---</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="supervisor">Supervisor Email *</label>
          <input
            id="supervisor"
            type="email"
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
            placeholder="lecturer@university.edu"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <Link to="/student/projects" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default CreateProject;
