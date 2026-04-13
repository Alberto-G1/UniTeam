import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
const AUTH_BASE_URL = 'http://localhost:8000/api/auth';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${AUTH_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const response = await axios.post(`${AUTH_BASE_URL}/login/`, {
      username,
      password,
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post(`${AUTH_BASE_URL}/register/`, userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get(`${AUTH_BASE_URL}/me/`);
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  list: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  create: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  update: async (id, projectData) => {
    const response = await api.put(`/projects/${id}/`, projectData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  getTeam: async (id) => {
    const response = await api.get(`/projects/${id}/team/`);
    return response.data;
  },

  getMilestones: async (id) => {
    const response = await api.get(`/projects/${id}/milestones/`);
    return response.data;
  },

  getRecentFiles: async (id) => {
    const response = await api.get(`/projects/${id}/recent_files/`);
    return response.data;
  },

  getSubmissionChecklist: async (id) => {
    const response = await api.get(`/projects/${id}/submission_checklist/`);
    return response.data;
  },

  getCandidateStudents: async (id, q = '') => {
    const response = await api.get(`/projects/${id}/candidate_students/`, {
      params: { q },
    });
    return response.data;
  },

  getPendingInvitations: async (id) => {
    const response = await api.get(`/projects/${id}/pending_invitations/`);
    return response.data;
  },

  getInvitationsOverview: async (id, status = '') => {
    const response = await api.get(`/projects/${id}/invitations_overview/`, {
      params: status ? { status } : {},
    });
    return response.data;
  },

  searchByCourseCode: async (courseCode) => {
    const response = await api.get('/projects/search_by_course_code/', {
      params: courseCode ? { course_code: courseCode } : {},
    });
    return response.data;
  },

  linkLecturer: async (id, courseCode = '') => {
    const response = await api.post(`/projects/${id}/link_lecturer/`, {
      course_code: courseCode,
    });
    return response.data;
  },

  inviteMember: async (id, receiverId) => {
    const response = await api.post(`/projects/${id}/invite_member/`, {
      receiver_id: receiverId,
    });
    return response.data;
  },

  submitProject: async (id) => {
    const response = await api.post(`/projects/${id}/submit_project/`);
    return response.data;
  },

  archiveProject: async (id) => {
    const response = await api.post(`/projects/${id}/archive_project/`);
    return response.data;
  },

  transferOwnership: async (id, newLeaderId) => {
    const response = await api.post(`/projects/${id}/transfer_ownership/`, {
      new_leader_id: newLeaderId,
    });
    return response.data;
  },

  leaveTeam: async (id) => {
    const response = await api.post(`/projects/${id}/leave_team/`);
    return response.data;
  },
};

// Milestones API
export const milestonesAPI = {
  list: async () => {
    const response = await api.get('/milestones/');
    return response.data;
  },

  create: async (milestoneData) => {
    const response = await api.post('/milestones/', milestoneData);
    return response.data;
  },

  update: async (id, milestoneData) => {
    const response = await api.put(`/milestones/${id}/`, milestoneData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/milestones/${id}/`);
    return response.data;
  },
};

// Invitations API
export const invitationsAPI = {
  list: async () => {
    const response = await api.get('/invitations/');
    return response.data;
  },

  create: async (invitationData) => {
    const response = await api.post('/invitations/', invitationData);
    return response.data;
  },

  accept: async (id) => {
    const response = await api.post(`/invitations/${id}/accept/`);
    return response.data;
  },

  decline: async (id) => {
    const response = await api.post(`/invitations/${id}/decline/`);
    return response.data;
  },

  resend: async (id) => {
    const response = await api.post(`/invitations/${id}/resend/`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/invitations/${id}/cancel/`);
    return response.data;
  },

  expireStale: async () => {
    const response = await api.post('/invitations/expire_stale/');
    return response.data;
  },
};

export const notificationsAPI = {
  list: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  unreadCount: async () => {
    const response = await api.get('/notifications/unread_count/');
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },
};

export const taskAPI = {
  getBoard: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/task_board/`);
    return response.data;
  },

  listTasks: async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}/`, taskData);
    return response.data;
  },

  setStatus: async (id, statusData) => {
    const response = await api.post(`/tasks/${id}/set_status/`, statusData);
    return response.data;
  },

  updateProgress: async (id, progressData) => {
    const response = await api.post(`/tasks/${id}/update_progress/`, progressData);
    return response.data;
  },

  reassign: async (id, reassignData) => {
    const response = await api.post(`/tasks/${id}/reassign/`, reassignData);
    return response.data;
  },

  cancel: async (id, cancelData = {}) => {
    const response = await api.post(`/tasks/${id}/cancel/`, cancelData);
    return response.data;
  },

  addSubtask: async (id, subtaskData) => {
    const response = await api.post(`/tasks/${id}/add_subtask/`, subtaskData);
    return response.data;
  },

  listSections: async (params = {}) => {
    const response = await api.get('/sections/', { params });
    return response.data;
  },

  createSection: async (sectionData) => {
    const response = await api.post('/sections/', sectionData);
    return response.data;
  },

  updateSection: async (id, sectionData) => {
    const response = await api.put(`/sections/${id}/`, sectionData);
    return response.data;
  },

  deleteSection: async (id) => {
    const response = await api.delete(`/sections/${id}/`);
    return response.data;
  },

  listComments: async (params = {}) => {
    const response = await api.get('/task-comments/', { params });
    return response.data;
  },

  createComment: async (commentData) => {
    const response = await api.post('/task-comments/', commentData);
    return response.data;
  },

  updateComment: async (id, commentData) => {
    const response = await api.put(`/task-comments/${id}/`, commentData);
    return response.data;
  },

  listAttachments: async (params = {}) => {
    const response = await api.get('/task-attachments/', { params });
    return response.data;
  },

  uploadAttachment: async (formData) => {
    const response = await api.post('/task-attachments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  promoteAttachmentToLibrary: async (attachmentId, payload = {}) => {
    const response = await api.post(`/task-attachments/${attachmentId}/promote_to_library/`, payload);
    return response.data;
  },

  deleteAttachment: async (id) => {
    const response = await api.delete(`/task-attachments/${id}/`);
    return response.data;
  },
};

export const projectFilesAPI = {
  listFolders: async (params = {}) => {
    const response = await api.get('/file-folders/', { params });
    return response.data;
  },

  createFolder: async (folderData) => {
    const response = await api.post('/file-folders/', folderData);
    return response.data;
  },

  updateFolder: async (id, folderData) => {
    const response = await api.put(`/file-folders/${id}/`, folderData);
    return response.data;
  },

  deleteFolder: async (id) => {
    const response = await api.delete(`/file-folders/${id}/`);
    return response.data;
  },

  listFiles: async (params = {}) => {
    const response = await api.get('/project-files/', { params });
    return response.data;
  },

  getFile: async (id) => {
    const response = await api.get(`/project-files/${id}/`);
    return response.data;
  },

  createFile: async (formData) => {
    const response = await api.post('/project-files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadVersion: async (id, formData) => {
    const response = await api.post(`/project-files/${id}/upload_version/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  startVersionLock: async (id) => {
    const response = await api.post(`/project-files/${id}/start_version_lock/`);
    return response.data;
  },

  moveFolder: async (id, folderId) => {
    const response = await api.post(`/project-files/${id}/move_folder/`, { folder_id: folderId });
    return response.data;
  },

  rename: async (id, displayName) => {
    const response = await api.post(`/project-files/${id}/rename/`, { display_name: displayName });
    return response.data;
  },

  deleteFile: async (id) => {
    const response = await api.delete(`/project-files/${id}/`);
    return response.data;
  },

  listVersions: async (params = {}) => {
    const response = await api.get('/project-file-versions/', { params });
    return response.data;
  },

  listActivity: async (params = {}) => {
    const response = await api.get('/project-file-activity/', { params });
    return response.data;
  },

  listTrash: async (params = {}) => {
    const response = await api.get('/project-trash/', { params });
    return response.data;
  },

  restoreTrash: async (id) => {
    const response = await api.post(`/project-trash/${id}/restore/`);
    return response.data;
  },
};

// Team Memberships API
export const teamMembershipsAPI = {
  list: async () => {
    const response = await api.get('/team-memberships/');
    return response.data;
  },

  changeRole: async (id, role) => {
    const response = await api.post(`/team-memberships/${id}/change_role/`, { role });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/team-memberships/${id}/`);
    return response.data;
  },
};

// Project Templates API
export const projectTemplatesAPI = {
  list: async () => {
    const response = await api.get('/project-templates/');
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`/project-templates/${id}/`);
    return response.data;
  },

  create: async (templateData) => {
    const response = await api.post('/project-templates/', templateData);
    return response.data;
  },

  update: async (id, templateData) => {
    const response = await api.put(`/project-templates/${id}/`, templateData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/project-templates/${id}/`);
    return response.data;
  },
};

export const milestoneTemplatesAPI = {
  list: async () => {
    const response = await api.get('/milestone-templates/');
    return response.data;
  },

  create: async (milestoneTemplateData) => {
    const response = await api.post('/milestone-templates/', milestoneTemplateData);
    return response.data;
  },

  update: async (id, milestoneTemplateData) => {
    const response = await api.put(`/milestone-templates/${id}/`, milestoneTemplateData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/milestone-templates/${id}/`);
    return response.data;
  },
};

// Users API (admin only)
export const usersAPI = {
  list: async () => {
    const response = await api.get(`${AUTH_BASE_URL}/users/`);
    return response.data;
  },

  get: async (id) => {
    const response = await api.get(`${AUTH_BASE_URL}/users/${id}/`);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`${AUTH_BASE_URL}/users/${id}/`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${AUTH_BASE_URL}/users/${id}/`);
    return response.data;
  },

  approveLecturer: async (id) => {
    const response = await api.post(`${AUTH_BASE_URL}/users/${id}/approve_lecturer/`);
    return response.data;
  },
};

export default api;
