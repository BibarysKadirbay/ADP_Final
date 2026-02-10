import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderAPI } from '../api.jsx'

export default function Orders() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await orderAPI.getUserOrders()
            setOrders(response.data || [])
        } catch (err) {
            setError('Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return

        try {
            await orderAPI.cancelOrder(orderId)
            setOrders(orders.map(order =>
                order._id === orderId || order.id === orderId ? { ...order, status: 'Cancelled' } : order
            ))
        } catch (err) {
            alert('Failed to cancel order')
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">My Orders</h1>

                {error && <div className="alert alert-danger">{error}</div>}

                {orders.length === 0 ? (
                    <div className="alert alert-info">No orders found</div>
                ) : (
                    <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Delivery</th>
                                    <th>Total Amount</th>
                                    <th>Items</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const orderId = order._id || order.id
                                    return (
                                        <tr key={orderId}>
                                            <td>
                                                <button
                                                    onClick={() => navigate(`/orders/${orderId}`)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#3498db',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        padding: 0,
                                                    }}
                                                >
                                                    {orderId.substring ? orderId.substring(0, 8) : orderId}...
                                                </button>
                                            </td>
                                            <td>{new Date(order.created_at || order.order_date).toLocaleDateString()}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        backgroundColor:
                                                            order.status === 'Completed'
                                                                ? '#d4edda'
                                                                : order.status === 'Cancelled'
                                                                    ? '#f8d7da'
                                                                    : '#d1ecf1',
                                                        color:
                                                            order.status === 'Completed'
                                                                ? '#155724'
                                                                : order.status === 'Cancelled'
                                                                    ? '#721c24'
                                                                    : '#0c5460'
                                                    }}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                {order.delivery_status ? (
                                                    <div>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.85rem',
                                                                backgroundColor:
                                                                    order.delivery_status === 'delivered'
                                                                        ? '#d4edda'
                                                                        : order.delivery_status === 'in_transit'
                                                                            ? '#fff3cd'
                                                                            : order.delivery_status === 'accepted'
                                                                                ? '#cfe2ff'
                                                                                : '#e2e3e5',
                                                                color:
                                                                    order.delivery_status === 'delivered'
                                                                        ? '#155724'
                                                                        : order.delivery_status === 'in_transit'
                                                                            ? '#664d03'
                                                                            : order.delivery_status === 'accepted'
                                                                                ? '#084298'
                                                                                : '#383d41'
                                                            }}
                                                        >
                                                            {order.delivery_status === 'in_transit' && '📦 In Transit'}
                                                            {order.delivery_status === 'accepted' && '✓ Accepted'}
                                                            {order.delivery_status === 'delivered' && '✓ Delivered'}
                                                            {order.delivery_status === 'pending' && '⏳ Pending'}
                                                        </span>
                                                        {order.delivery_address && (
                                                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#666' }}>
                                                                {order.delivery_address}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '0.9rem' }}>—</span>
                                                )}
                                            </td>
                                            <td>${order.total_amount?.toFixed(2) || '0.00'}</td>
                                            <td>{order.items?.length || 0} item(s)</td>
                                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={() => navigate(`/orders/${orderId}`)}
                                                    style={{ padding: '0.4rem 0.8rem' }}
                                                >
                                                    View Details
                                                </button>
                                                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                                                    <button
                                                        className="btn btn-danger btn-small"
                                                        onClick={() => handleCancelOrder(orderId)}
                                                        style={{ padding: '0.4rem 0.8rem' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
