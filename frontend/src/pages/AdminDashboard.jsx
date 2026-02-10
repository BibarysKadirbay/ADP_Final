import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI, bookAPI } from '../api.jsx'
import { useAuth } from '../context/AuthContext'

const defaultFormats = [{ type: 'physical', price: 0, stock_quantity: 0, access_url: '' }, { type: 'digital', price: 0, stock_quantity: 0, access_url: '' }]

export default function AdminDashboard() {
    const navigate = useNavigate()
    const { user, isAdmin, isModerator } = useAuth()
    const [stats, setStats] = useState(null)
    const [activeTab, setActiveTab] = useState(isAdmin ? 'stats' : 'books')
    const [books, setBooks] = useState([])
    const [orders, setOrders] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showBookForm, setShowBookForm] = useState(false)
    const [editingBook, setEditingBook] = useState(null)
    const [bookForm, setBookForm] = useState({
        title: '',
        author: '',
        description: '',
        image_url: '',
        published_year: '',
        isbn: '',
        category: '',
        formats: defaultFormats.map(f => ({ ...f })),
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            const booksPromise = bookAPI.getBooks()
            const usersPromise = (isAdmin || isModerator) ? adminAPI.getAllUsers() : Promise.resolve({ data: [] })
            const statsPromise = isAdmin ? adminAPI.getStats() : Promise.resolve({ data: null })
            const ordersPromise = isAdmin ? adminAPI.getAllOrders() : Promise.resolve({ data: [] })

            // Use allSettled so a single failing admin call (e.g. permissions) won't break loading books
            const results = await Promise.allSettled([booksPromise, usersPromise, statsPromise, ordersPromise])

            // books
            if (results[0].status === 'fulfilled') {
                setBooks(results[0].value.data || [])
            } else {
                setBooks([])
            }

            // users
            if (results[1].status === 'fulfilled') {
                setUsers(results[1].value.data || [])
            } else {
                setUsers([])
            }

            // stats
            if (results[2].status === 'fulfilled') {
                setStats(results[2].value.data)
            } else {
                setStats(null)
            }

            // orders
            if (results[3].status === 'fulfilled') {
                setOrders(results[3].value.data || [])
            } else {
                setOrders([])
            }
        } catch (err) {
            // fallback: set minimal state but don't block UI
            setBooks([])
            setUsers([])
            setStats(null)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteBook = async (bookId) => {
        if (!window.confirm('Delete this book?')) return
        try {
            await bookAPI.deleteBook(bookId)
            setBooks(books.filter(b => (b.id || b._id) !== bookId))
        } catch (err) {
            alert('Failed to delete book')
        }
    }

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await adminAPI.updateOrderStatus(orderId, newStatus)
            setOrders(orders.map(o => (o.id || o._id) === orderId ? { ...o, status: newStatus } : o))
        } catch (err) {
            alert('Failed to update order')
        }
    }

    const handleDeactivateUser = async (userId) => {
        if (!window.confirm('Deactivate this user?')) return
        try {
            await adminAPI.deactivateUser(userId)
            setUsers(users.map(u => (u._id || u.id) === userId ? { ...u, is_active: false } : u))
        } catch (err) {
            alert('Failed to deactivate user')
        }
    }

    const handleUpgradePremium = async (userId, days) => {
        const d = parseInt(prompt('Premium days:', 30), 10)
        if (!d || d < 1) return
        try {
            await adminAPI.upgradeToPremium(userId, { days: d })
            fetchData()
        } catch (err) {
            alert('Failed to upgrade user')
        }
    }

    const handleUpdateRole = async (userId, role) => {
        try {
            await adminAPI.updateUserRole(userId, role)
            setUsers(users.map(u => (u._id || u.id) === userId ? { ...u, role } : u))
        } catch (err) {
            alert('Failed to update role')
        }
    }

    const handleUpdateDeliveryStatus = async (orderId, status) => {
        const address = prompt('Enter delivery address:', '')
        if (!address) return
        try {
            await adminAPI.updateDeliveryStatus(orderId, status, address)
            setOrders(orders.map(o => (o.id || o._id) === orderId ? { ...o, delivery_status: status, delivery_address: address } : o))
            alert('Delivery status updated')
        } catch (err) {
            alert('Failed to update delivery status')
        }
    }

    const openAddBook = () => {
        setEditingBook(null)
        setBookForm({
            title: '',
            author: '',
            description: '',
            image_url: '',
            published_year: '',
            isbn: '',
            category: '',
            formats: defaultFormats.map(f => ({ ...f })),
        })
        setShowBookForm(true)
    }

    const openEditBook = (book) => {
        setEditingBook(book.id || book._id)
        setBookForm({
            title: book.title || '',
            author: book.author || '',
            description: book.description || '',
            image_url: book.image_url || '',
            published_year: book.published_year || '',
            isbn: book.isbn || '',
            category: book.category || '',
            formats: (book.formats && book.formats.length) ? book.formats.map(f => ({ type: f.type, price: f.price || 0, stock_quantity: f.stock_quantity || 0, access_url: f.access_url || '' })) : defaultFormats.map(f => ({ ...f })),
        })
        setShowBookForm(true)
    }

    const handleBookFormSubmit = async (e) => {
        e.preventDefault()
        const payload = {
            title: bookForm.title,
            author: bookForm.author,
            description: bookForm.description,
            image_url: bookForm.image_url || undefined,
            published_year: parseInt(bookForm.published_year, 10) || 0,
            isbn: bookForm.isbn || undefined,
            category: bookForm.category || undefined,
            formats: bookForm.formats.filter(f => f.type).map(f => ({
                type: f.type,
                price: parseFloat(f.price) || 0,
                stock_quantity: parseInt(f.stock_quantity, 10) || 0,
                access_url: f.access_url || undefined,
            })),
        }
        if (payload.formats.length === 0) {
            alert('Add at least one format (physical, digital, or both)')
            return
        }
        try {
            if (editingBook) {
                await bookAPI.updateBook(editingBook, payload)
                setBooks(books.map(b => (b.id || b._id) === editingBook ? { ...b, ...payload } : b))
            } else {
                const res = await bookAPI.createBook(payload)
                const newBook = { id: res.data.id, ...payload }
                setBooks([...books, newBook])
            }
            setShowBookForm(false)
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save book')
        }
    }

    const orderId = (o) => o.id || o._id
    const userId = (u) => u._id || u.id

    if (loading) {
        return (
            <div className="page">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Dashboard</h1>
                <div className="admin-tabs">
                    {isAdmin && (
                        <>
                            <button className={`btn btn-small ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('stats')}>Statistics</button>
                            <button className={`btn btn-small ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('orders')}>Orders</button>
                        </>
                    )}
                    {isAdmin && (
                        <button className={`btn btn-small ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>Users</button>
                    )}
                    <button className={`btn btn-small ${activeTab === 'books' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('books')}>Books</button>
                </div>

                {isModerator && !isAdmin && (
                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                        📚 Moderator Dashboard - You can manage books and view users (view only, no modifications).
                    </div>
                )}

                {activeTab === 'stats' && stats && isAdmin && (
                    <div className="admin-stats-grid">
                        <div className="card stat-card"><p>Total Users</p><h2>{stats.total_users}</h2></div>
                        <div className="card stat-card"><p>Total Books</p><h2>{stats.total_books}</h2></div>
                        <div className="card stat-card"><p>Total Orders</p><h2>{stats.total_orders}</h2></div>
                        <div className="card stat-card"><p>Premium Users</p><h2>{stats.premium_users}</h2></div>
                        <div className="card stat-card"><p>Total Revenue</p><h2>${(stats.total_revenue || 0).toFixed(2)}</h2></div>
                        <div className="card stat-card"><p>Admins</p><h2>{stats.admins}</h2></div>
                        <div className="card stat-card"><p>Moderators</p><h2>{stats.moderators}</h2></div>
                        <div className="card stat-card"><p>Pending Orders</p><h2>{stats.pending_orders}</h2></div>
                        <div className="card stat-card"><p>Completed</p><h2>{stats.completed_orders}</h2></div>
                    </div>
                )}

                {activeTab === 'books' && (
                    <div>
                        {(isModerator || isAdmin) && (
                            <button className="btn btn-success" onClick={openAddBook} style={{ marginBottom: '1rem' }}>Add Book</button>
                        )}
                        {showBookForm && (
                            <form className="card admin-book-form" onSubmit={handleBookFormSubmit}>
                                <h3>{editingBook ? 'Edit Book' : 'New Book'}</h3>
                                <div className="form-group">
                                    <label>Title</label>
                                    <input value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Author</label>
                                    <input value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} rows={3} />
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input value={bookForm.image_url} onChange={e => setBookForm({ ...bookForm, image_url: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Year</label>
                                        <input type="number" value={bookForm.published_year} onChange={e => setBookForm({ ...bookForm, published_year: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>ISBN</label>
                                        <input value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <input value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Formats (physical, digital, or both)</label>
                                    {bookForm.formats.map((f, i) => (
                                        <div key={i} style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                                <select value={f.type} onChange={e => {
                                                    const formats = [...bookForm.formats]
                                                    formats[i] = { ...formats[i], type: e.target.value }
                                                    setBookForm({ ...bookForm, formats })
                                                }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }}>
                                                    <option value="physical">Physical</option>
                                                    <option value="digital">Digital</option>
                                                    <option value="both">Both</option>
                                                </select>
                                                <input type="number" step="0.01" placeholder="Price" value={f.price || ''} onChange={e => {
                                                    const formats = [...bookForm.formats]
                                                    formats[i] = { ...formats[i], price: e.target.value }
                                                    setBookForm({ ...bookForm, formats })
                                                }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }} />
                                                <input type="number" min="0" placeholder="Stock" value={f.stock_quantity || ''} onChange={e => {
                                                    const formats = [...bookForm.formats]
                                                    formats[i] = { ...formats[i], stock_quantity: e.target.value }
                                                    setBookForm({ ...bookForm, formats })
                                                }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da' }} />
                                            </div>
                                            {(f.type === 'digital' || f.type === 'both') && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Access URL (PDF link, website, etc.)"
                                                        value={f.access_url || ''}
                                                        onChange={e => {
                                                            const formats = [...bookForm.formats]
                                                            formats[i] = { ...formats[i], access_url: e.target.value }
                                                            setBookForm({ ...bookForm, formats })
                                                        }}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                                                    />
                                                    <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                                                        Provide the link to the PDF or digital access page that users will open
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowBookForm(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{editingBook ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        )}
                        {books.length === 0 ? (
                            <div className="alert alert-info">No books</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Author</th>
                                            <th>Year</th>
                                            <th>Formats</th>
                                            {(isModerator || isAdmin) && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.map((book) => (
                                            <tr key={book.id || book._id}>
                                                <td>{book.title}</td>
                                                <td>{book.author}</td>
                                                <td>{book.published_year || '-'}</td>
                                                <td>{(book.formats || []).map(f => f.type).join(', ')}</td>
                                                {(isModerator || isAdmin) && (
                                                    <td>
                                                        <button className="btn btn-primary btn-small" onClick={() => openEditBook(book)} style={{ marginRight: '0.5rem' }}>Edit</button>
                                                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteBook(book.id || book._id)}>Delete</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && isAdmin && (
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
                                        <th>Delivery Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={orderId(order)}>
                                            <td>{(orderId(order)).toString().slice(0, 8)}...</td>
                                            <td>{(order.user_id || order.userId || '').toString().slice(0, 8)}...</td>
                                            <td>${(order.total_amount || 0).toFixed(2)}</td>
                                            <td>
                                                <select value={order.status} onChange={e => handleUpdateOrderStatus(orderId(order), e.target.value)} style={{ padding: '0.5rem' }}>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td>
                                                {order.delivery_status ? (
                                                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                        <select value={order.delivery_status} onChange={e => handleUpdateDeliveryStatus(orderId(order), e.target.value)} style={{ padding: '0.25rem', fontSize: '0.85rem', flex: 1 }}>
                                                            <option value="pending">Pending</option>
                                                            <option value="accepted">Accepted</option>
                                                            <option value="in_transit">In Transit</option>
                                                            <option value="delivered">Delivered</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-primary btn-small" onClick={() => handleUpdateDeliveryStatus(orderId(order), 'pending')} style={{ fontSize: '0.75rem' }}>Set Delivery</button>
                                                )}
                                            </td>
                                            <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'users' && isAdmin && (
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
                                        <th>Premium</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={userId(u)}>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <select value={u.role || 'Customer'} onChange={e => handleUpdateRole(userId(u), e.target.value)} style={{ padding: '0.25rem' }}>
                                                    <option value="Customer">Customer</option>
                                                    <option value="Moderator">Moderator</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </td>
                                            <td>{u.is_premium ? 'Yes' : 'No'}</td>
                                            <td>
                                                <button className="btn btn-success btn-small" onClick={() => handleUpgradePremium(userId(u))} style={{ marginRight: '0.5rem' }}>Premium</button>
                                                <button className="btn btn-danger btn-small" onClick={() => handleDeactivateUser(userId(u))}>Deactivate</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'users' && isModerator && !isAdmin && (
                    <div>
                        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                            ℹ️ As a moderator, you can view users but cannot modify their accounts, roles, or premium status.
                        </div>
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
                                            <th>Premium</th>
                                            <th>Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={userId(u)}>
                                                <td>{u.username}</td>
                                                <td>{u.email}</td>
                                                <td>{u.role || 'Customer'}</td>
                                                <td>{u.is_premium ? 'Yes' : 'No'}</td>
                                                <td>{u.is_active !== false ? '✓ Active' : '✗ Inactive'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
