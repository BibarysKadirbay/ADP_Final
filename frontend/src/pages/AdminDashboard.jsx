import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI, bookAPI, orderAPI } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const [stats, setStats] = useState(null)
    const [activeTab, setActiveTab] = useState('stats')
    const [books, setBooks] = useState([])
    const [orders, setOrders] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAdmin) {
            navigate('/books')
            return
        }
        fetchData()
    }, [isAdmin, navigate])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [statsRes, booksRes, ordersRes, usersRes] = await Promise.all([
                userAPI.getStats(),
                bookAPI.getBooks(),
                orderAPI.getAllOrders(),
                userAPI.getUsers()
            ])
            setStats(statsRes.data)
            setBooks(booksRes.data || [])
            setOrders(ordersRes.data || [])
            setUsers(usersRes.data || [])
        } catch (err) {
            alert('Failed to fetch admin data')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm('Are you sure?')) return
        try {
            await bookAPI.deleteBook(bookId)
            setBooks(books.filter(b => b._id !== bookId))
        } catch (err) {
            alert('Failed to delete book')
        }
    }

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await orderAPI.updateOrderStatus(orderId, newStatus)
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ))
        } catch (err) {
            alert('Failed to update order')
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure?')) return
        try {
            await userAPI.deleteUser(userId)
            setUsers(users.filter(u => u._id !== userId))
        } catch (err) {
            alert('Failed to delete user')
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Admin Dashboard</h1>

                <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
                    <button
                        className={`btn btn-${activeTab === 'stats' ? 'primary' : 'secondary'} btn-small`}
                        onClick={() => setActiveTab('stats')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Statistics
                    </button>
                    <button
                        className={`btn btn-${activeTab === 'books' ? 'primary' : 'secondary'} btn-small`}
                        onClick={() => setActiveTab('books')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Books
                    </button>
                    <button
                        className={`btn btn-${activeTab === 'orders' ? 'primary' : 'secondary'} btn-small`}
                        onClick={() => setActiveTab('orders')}
                        style={{ marginRight: '0.5rem' }}
                    >
                        Orders
                    </button>
                    <button
                        className={`btn btn-${activeTab === 'users' ? 'primary' : 'secondary'} btn-small`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </button>
                </div>

                {/* Statistics Tab */}
                {activeTab === 'stats' && stats && (
                    <div className="grid grid-3">
                        <div className="card" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>Total Users</p>
                            <h2 style={{ fontSize: '2rem', color: '#3498db' }}>{stats.total_users}</h2>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>Customers</p>
                            <h2 style={{ fontSize: '2rem', color: '#27ae60' }}>{stats.customers}</h2>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.9rem', color: '#666' }}>Admins</p>
                            <h2 style={{ fontSize: '2rem', color: '#e74c3c' }}>{stats.admins}</h2>
                        </div>
                    </div>
                )}

                {/* Books Tab */}
                {activeTab === 'books' && (
                    <div>
                        <button className="btn btn-success" onClick={() => navigate('/admin/books/new')} style={{ marginBottom: '1rem' }}>
                            Add New Book
                        </button>
                        {books.length === 0 ? (
                            <div className="alert alert-info">No books yet</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Author</th>
                                            <th>Formats</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map((book) => (
                                            <tr key={book._id}>
                                                <td>{book.title}</td>
                                                <td>{book.author}</td>
                                                <td>{book.formats?.length || 0}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger btn-small"
                                                        onClick={() => handleDeleteBook(book._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div style={{ overflowX: 'auto' }}>
                        {orders.length === 0 ? (
                            <div className="alert alert-info">No orders</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>User ID</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>{order.id.substring(0, 8)}...</td>
                                            <td>{order.user_id.substring(0, 8)}...</td>
                                            <td>${order.total_amount.toFixed(2)}</td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    style={{ padding: '0.5rem' }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {new Date(order.order_date).toLocaleDateString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div style={{ overflowX: 'auto' }}>
                        {users.length === 0 ? (
                            <div className="alert alert-info">No users</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
