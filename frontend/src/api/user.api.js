import api from './axios';

export const getUsers = async (search = '') => {
  const response = await api.get(`/users?search=${search}`);
  return response;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response;
};

