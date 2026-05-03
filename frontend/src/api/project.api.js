import api from './axios';

export const getProjects = () => api.get('/api/projects');
export const getProjectById = (id) => api.get(`/api/projects/${id}`);
export const createProject = (data) => api.post('/api/projects', data);
export const addMember = (id, data) => api.post(`/api/projects/${id}/members`, data);
export const removeMember = (projectId, userId) => api.delete(`/api/projects/${projectId}/members/${userId}`);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
