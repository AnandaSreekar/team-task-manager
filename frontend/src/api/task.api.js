import api from './axios';

export const getTasks = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/tasks${params ? '?' + params : ''}`);
};

export const getDashboard = () => api.get('/tasks/dashboard');
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
