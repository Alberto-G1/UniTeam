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

  approveLecturer: async (id) => {
    const response = await api.post(`${AUTH_BASE_URL}/users/${id}/approve_lecturer/`);
    return response.data;
  },
};

export default api;
