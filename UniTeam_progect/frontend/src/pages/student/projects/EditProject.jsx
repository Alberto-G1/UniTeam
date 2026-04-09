// src/pages/student/projects/EditProject.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import Alert from '../../../components/Alert';
import './ProjectForms.css';

export const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(id);
      setFormData({
        title: response.data.title,
        description: response.data.description || '',
        deadline: response.data.deadline || '',
      });
    } catch (error) {
      console.error('Error loading project:', error);
      showToast('error', 'Error', 'Failed to load project');
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.deadline) newErrors.deadline = 'Project deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSaving(true);

    try {
      await projectsAPI.update(id, formData);
      showToast('success', 'Updated', 'Project has been updated successfully');
      navigate(`/student/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      showToast('error', 'Update Failed', 'Could not update project');
      setErrors({ submit: 'Failed to update project' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="project-form-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-form-page">
      <div className="form-header">
        <div>
          <h1>Edit Project</h1>
          <p className="form-description">Update your project information</p>
        </div>
        <Link to={`/student/projects/${id}`} className="btn-secondary">
          <i className="fa-solid fa-arrow-left"></i>
          Back to Project
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-card">
          <h3>Project Information</h3>
          
          <div className="form-group">
            <label htmlFor="title">
              Project Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter project title"
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input form-textarea"
              rows="6"
              placeholder="Describe your project goals and objectives..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">
              Project Deadline <span className="required">*</span>
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`form-input ${errors.deadline ? 'error' : ''}`}
            />
            {errors.deadline && <div className="field-error">{errors.deadline}</div>}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i>
                Save Changes
              </>
            )}
          </button>
          <Link to={`/student/projects/${id}`} className="btn-secondary">
            Cancel
          </Link>
        </div>

        {errors.submit && (
          <Alert type="error" title="Error" message={errors.submit} />
        )}
      </form>
    </div>
  );
};