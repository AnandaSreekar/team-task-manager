import api from './axios';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const addMember = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/members`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const removeMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};
