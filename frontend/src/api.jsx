import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api' || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const authAPI = {
  register: (username, email, password) =>
    apiClient.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  getProfile: () =>
    apiClient.get('/auth/profile'),
};

export const bookAPI = {
  getBooks: (params) =>
    apiClient.get('/books', { params: params || {} }),
  getBookByID: (id) =>
    apiClient.get(`/books/${id}`),
  createBook: (data) =>
    apiClient.post('/admin/books', data),
  updateBook: (id, data) =>
    apiClient.put(`/admin/books/${id}`, data),
  deleteBook: (id) =>
    apiClient.delete(`/admin/books/${id}`),
};

export const orderAPI = {
  createOrder: (items) =>
    apiClient.post('/orders', { items }),
  getUserOrders: () =>
    apiClient.get('/orders'),
  cancelOrder: (id) =>
    apiClient.delete(`/orders/${id}`),
};

export const digitalAPI = {
  getPersonalLibrary: () =>
    apiClient.get('/library'),
  getDigitalBookAccess: (formatId) =>
    apiClient.get(`/library/${formatId}`),
  listAvailableDigitalBooks: () =>
    apiClient.get('/digital-books'),
};

export const adminAPI = {
    getStats: () =>
        apiClient.get('/admin/stats'),
    getAllUsers: () =>
        apiClient.get('/admin/users'),
    deactivateUser: (id) =>
        apiClient.put(`/admin/users/${id}/deactivate`),
    upgradeToPremium: (id, data) =>
        apiClient.put(`/admin/users/${id}/premium`, data),
    getAllOrders: () =>
        apiClient.get('/admin/orders'),
    updateOrderStatus: (id, status) =>
        apiClient.put(`/admin/orders/${id}`, { status }),
    getAllBooks: () =>
        apiClient.get('/books'),
};

export const userAPI = {
    getStats: () =>
        apiClient.get('/admin/stats'),
    getUsers: () =>
        apiClient.get('/admin/users'),
    deactivateUser: (id) =>
        apiClient.put(`/admin/users/${id}/deactivate`),
    upgradeToPremium: (id, data) =>
        apiClient.put(`/admin/users/${id}/premium`, data),
    deleteUser: (id) =>
        apiClient.put(`/admin/users/${id}/deactivate`),
};



export default apiClient;