import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

const api = axios.create({
    baseURL: API_BASE_URL
})

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const authAPI = {
    register: (username, email, password) =>
        api.post('/auth/register', { username, email, password }),

    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    getProfile: () =>
        api.get('/auth/profile')
}

export const bookAPI = {
    getBooks: (search = '') =>
        api.get('/books', { params: { search } }),

    getBook: (id) =>
        api.get(`/books/${id}`),

    createBook: (data) =>
        api.post('/admin/books', data),

    updateBook: (id, data) =>
        api.put(`/admin/books/${id}`, data),

    deleteBook: (id) =>
        api.delete(`/admin/books/${id}`)
}

export const orderAPI = {
    createOrder: (items) =>
        api.post('/orders', { items }),

    getUserOrders: () =>
        api.get('/orders'),

    getAllOrders: () =>
        api.get('/admin/orders'),

    updateOrderStatus: (id, status) =>
        api.put(`/admin/orders/${id}`, { status }),

    cancelOrder: (id) =>
        api.delete(`/orders/${id}`)
}

export const digitalAPI = {
    getLibrary: () =>
        api.get('/library'),

    getAccess: (formatId) =>
        api.get(`/library/${formatId}`),

    listDigitalBooks: () =>
        api.get('/digital-books')
}

export const userAPI = {
    getUsers: () =>
        api.get('/admin/users'),

    getUser: (id) =>
        api.get(`/admin/users/${id}`),

    updateUserRole: (id, role) =>
        api.put(`/admin/users/${id}/role`, { role }),

    deleteUser: (id) =>
        api.delete(`/admin/users/${id}`),

    getStats: () =>
        api.get('/admin/stats')
}

export default api
