import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../api';

export default function OrderDetails() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getOrderById(orderId);
            setOrder(response.data || response);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch order details');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            const d = new Date(date);
            if (isNaN(d)) return 'N/A';
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f39c12',
            accepted: '#3498db',
            in_transit: '#2980b9',
            delivered: '#27ae60',
            cancelled: '#e74c3c',
        };
        return colors[status.toLowerCase()] || '#95a5a6';
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="page">
                <div className="container">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="alert alert-danger">{error || 'Order not found'}</div>
                        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
                            Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '900px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/orders')}
                        style={{ marginRight: '1rem', padding: '0.6rem 1.2rem' }}
                    >
                        ← Back to Orders
                    </button>
                    <h1 className="page-title" style={{ margin: 0 }}>Order Details</h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Main Details */}
                    <div>
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Order ID</p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50', wordBreak: 'break-all', fontSize: '0.85rem' }}>{order._id || order.id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Order Date</p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
                                        {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Order Status</p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>{order.status || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Last Updated</p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
                                        {formatDate(order.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Order Items ({order.items?.length || 0})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                backgroundColor: 'white',
                                                borderRadius: '6px',
                                                border: '1px solid #ecf0f1',
                                            }}
                                        >
                                            <div>
                                                <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold', color: '#2c3e50' }}>
                                                    Book ID: {item.book_id}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f8c8d' }}>
                                                    Format: <strong>{item.format_type}</strong>
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                                    Qty: {item.quantity}
                                                </p>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50', fontSize: '1.1rem' }}>
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#7f8c8d', textAlign: 'center' }}>No items in this order</p>
                                )}
                            </div>
                        </div>

                        {/* Delivery Info */}
                        {(order.delivery_status || order.delivery_address) && (
                            <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Delivery Information</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {order.delivery_status && (
                                        <div>
                                            <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                                                Delivery Status
                                            </p>
                                            <div
                                                style={{
                                                    display: 'inline-block',
                                                    backgroundColor: getStatusColor(order.delivery_status),
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {order.delivery_status}
                                            </div>
                                        </div>
                                    )}
                                    {order.delivery_address && (
                                        <div>
                                            <p style={{ margin: '0 0 0.3rem 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
                                                Delivery Address
                                            </p>
                                            <p style={{ margin: 0, color: '#2c3e50', whiteSpace: 'pre-wrap' }}>
                                                {order.delivery_address}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '2px solid #e74c3c' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Order Summary</h3>

                            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #d5dbdb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#7f8c8d' }}>Subtotal:</span>
                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                        ${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#2c3e50' }}>Total:</span>
                                <span style={{ color: '#e74c3c' }}>
                                    ${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}
                                </span>
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#2c3e50', fontWeight: 'bold' }}>
                                    Order Status: {order.status}
                                </p>
                                {order.status === 'Cancelled' && (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#e74c3c' }}>
                                        This order has been cancelled
                                    </p>
                                )}
                                {order.status === 'Completed' && (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#27ae60' }}>
                                        Thank you for your purchase!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
