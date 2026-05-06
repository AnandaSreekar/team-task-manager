import api from './axios';

export const getProjects = () => api.get('/projects');
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const addMember = (id, data) => api.post(`/projects/${id}/members`, data);
export const removeMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
