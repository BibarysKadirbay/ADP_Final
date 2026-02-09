import React, { useState, useEffect } from 'react'
import { orderAPI } from '../api'

export default function Orders() {
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
                order.id === orderId ? { ...order, status: 'Cancelled' } : order
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
                                    <th>Total Amount</th>
                                    <th>Items</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{order.id.substring(0, 8)}...</td>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td>
                                            <span
                                                style={{
                                                    padding: '0.3rem 0.8rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    backgroundColor:
                                                        order.status === 'Completed'
                                                            ? 'rgba(110, 71, 59, 0.1)'
                                                            : order.status === 'Cancelled'
                                                                ? 'rgba(201, 74, 63, 0.1)'
                                                                : 'rgba(225, 212, 194, 0.4)',
                                                    color:
                                                        order.status === 'Completed'
                                                            ? 'var(--brown-700)'
                                                            : order.status === 'Cancelled'
                                                                ? '#c94a3f'
                                                                : 'var(--muted)'
                                                }}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>${order.total_amount.toFixed(2)}</td>
                                        <td>{order.items?.length || 0} item(s)</td>
                                        <td>
                                            {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
