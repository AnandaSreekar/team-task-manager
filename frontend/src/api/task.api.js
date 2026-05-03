import api from './axios';

export const getTasks = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/api/tasks${params ? '?' + params : ''}`);
};

export const getDashboard = () => api.get('/api/tasks/dashboard');
export const createTask = (data) => api.post('/api/tasks', data);
export const updateTask = (id, data) => api.patch(`/api/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
