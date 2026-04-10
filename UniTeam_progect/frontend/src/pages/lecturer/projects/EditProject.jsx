import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import '../../student/projects/ProjectForms.css';

export const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(id);
      setProject(response);
      setFormData({
        title: response.title,
        description: response.description,
      });
    } catch (err) {
      setError('Failed to load project');
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
      await projectsAPI.update(id, formData);
      navigate(`/lecturer/projects/${id}`, { state: { message: 'Project updated' } });
    } catch (err) {
      setError('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="project-form-wrapper">
      <div className="form-header surface">
        <h1>Edit Project: {project.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="project-form surface">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
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
            rows="5"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to={`/lecturer/projects/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditProject;
