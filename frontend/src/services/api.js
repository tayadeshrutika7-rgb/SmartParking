// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Vehicles API
export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  getByOwner: (ownerId) => api.get(`/vehicles/owner/${ownerId}`),
  create: (vehicleData) => api.post('/vehicles', vehicleData),
  delete: (plateNo) => api.delete(`/vehicles/${plateNo}`),
};

// Parking Lots API
export const parkingLotsAPI = {
  getAll: () => api.get('/parking-lots'),
  getById: (id) => api.get(`/parking-lots/${id}`),
};

// Reservations API
export const reservationsAPI = {
  getAll: () => api.get('/reservations'),
  getByVehicle: (plateNo) => api.get(`/reservations/vehicle/${plateNo}`),
  getUserTotalSpent: (userId) => api.get(`/reservations/user/${userId}/total-spent`),
  getAdminDetails: () => api.get('/reservations/admin/details'),
  getUserSummary: () => api.get('/reservations/admin/user-summary'),
  create: (reservationData) => api.post('/reservations', reservationData),
  delete: (id) => api.delete(`/reservations/${id}`),
};

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  create: (paymentData) => api.post('/payments', paymentData),
};

export default api;