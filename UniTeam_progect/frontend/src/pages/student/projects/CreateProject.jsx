// src/pages/student/projects/CreateProject.jsx - REDESIGNED
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { projectTemplatesAPI, projectsAPI } from '../../../services/api';
import { useToast } from '../../../components/ToastContainer';
import Alert from '../../../components/Alert';
import './ProjectForms.css';

export const CreateProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_code: '',
    template_id: '',
    deadline: '',
    linked_lecturer_email: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await projectTemplatesAPI.list();
      const templatesList = response.results || response;
      setTemplates(templatesList);
    } catch (err) {
      console.error('Error loading templates:', err);
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
    if (!formData.course_code.trim()) newErrors.course_code = 'Course code is required';
    if (!formData.deadline) newErrors.deadline = 'Project deadline is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        course_code: formData.course_code.trim(),
        deadline: formData.deadline,
        linked_lecturer_email: formData.linked_lecturer_email.trim(),
      };

      if (formData.template_id) {
        payload.template_used = Number(formData.template_id);
      }

      await projectsAPI.create(payload);
      showToast('success', 'Project Created', 'Your project has been created successfully!');
      navigate('/student/projects');
    } catch (err) {
      const serverErrors = err?.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        const normalized = {};
        Object.keys(serverErrors).forEach((key) => {
          normalized[key] = Array.isArray(serverErrors[key]) ? serverErrors[key][0] : serverErrors[key];
        });
        setErrors((prev) => ({ ...prev, ...normalized }));
      }
      showToast('error', 'Creation Failed', 'Could not create project. Please try again.');
      setErrors({ submit: 'Failed to create project' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-page">
      <div className="form-header">
        <div>
          <h1>Create New Project</h1>
          <p className="form-description">Start a new project and invite your team members</p>
        </div>
        <Link to="/student/projects" className="btn-secondary">
          <i className="fa-solid fa-arrow-left"></i>
          Back to Projects
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-card">
          <h3>Project Details</h3>
          
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
              placeholder="Enter a descriptive title for your project"
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
              rows="5"
              placeholder="Describe your project goals, objectives, and expected outcomes..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="course_code">
              Course Code <span className="required">*</span>
            </label>
            <input
              type="text"
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              className={`form-input ${errors.course_code ? 'error' : ''}`}
              placeholder="e.g. SOFTENG 350"
            />
            {errors.course_code && <div className="field-error">{errors.course_code}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="template_id">Use Template (Optional)</label>
              <select
                id="template_id"
                name="template_id"
                value={formData.template_id}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">-- No Template --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
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

          <div className="form-group">
            <label htmlFor="linked_lecturer_email">Linked Lecturer Email (Optional)</label>
            <input
              type="email"
              id="linked_lecturer_email"
              name="linked_lecturer_email"
              value={formData.linked_lecturer_email}
              onChange={handleChange}
              className="form-input"
              placeholder="lecturer@university.edu"
            />
            <div className="form-hint">
              <i className="fa-regular fa-circle-info"></i>
              If this matches an approved lecturer account, they will be linked automatically.
            </div>
          </div>

          <div className="form-hint">
            <i className="fa-regular fa-circle-info"></i>
            Supervisor can be assigned later by lecturers/admin if needed.
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Creating Project...
              </>
            ) : (
              <>
                <i className="fa-solid fa-rocket"></i>
                Create Project
              </>
            )}
          </button>
          <Link to="/student/projects" className="btn-secondary">
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

export default CreateProject;