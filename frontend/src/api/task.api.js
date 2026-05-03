import api from './axios';

export const getTasks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/tasks?${params}`);
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/tasks/dashboard');
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};
