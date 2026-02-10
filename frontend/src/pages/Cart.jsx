import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderAPI } from '../api.jsx'

const PREMIUM_DISCOUNT = 10
const PREMIUM_COST = 22

export default function Cart() {
    const navigate = useNavigate()
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
    const { user, isPremium } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [deliveryAddress, setDeliveryAddress] = useState('')

    const hasPhysicalFormat = cart.some(item => item.formatType === 'physical' || item.formatType === 'both')

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login')
            return
        }
        if (cart.length === 0) {
            setError('Cart is empty')
            return
        }
        if (hasPhysicalFormat && !deliveryAddress.trim()) {
            setError('Please enter a delivery address for physical books')
            return
        }
        setLoading(true)
        setError('')
        try {
            const items = cart.map((item) => ({
                book_id: item.bookId,
                format_type: item.formatType,
                quantity: item.quantity,
            }))
            // Include delivery address if physical books in cart
            const orderData = { items }
            if (hasPhysicalFormat) {
                orderData.delivery_address = deliveryAddress
            }
            await orderAPI.createOrder(orderData)
            setSuccess('Order placed successfully!')
            clearCart()
            setTimeout(() => navigate('/orders'), 2000)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    if (cart.length === 0) {
        return (
            <div className="page">
                <div className="container">
                    <h1 className="page-title">Shopping Cart</h1>
                    <div className="alert alert-info">Your cart is empty</div>
                    <button className="btn btn-primary" onClick={() => navigate('/books')}>Continue Shopping</button>
                </div>
            </div>
        )
    }

    const discount = isPremium ? PREMIUM_DISCOUNT : 0
    const total = getTotalPrice(discount)
    const subtotal = getTotalPrice(0)

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Shopping Cart</h1>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', maxWidth: '1200px' }}>
                    {/* Cart Items */}
                    <div>
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Items ({cart.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {cart.map((item) => (
                                    <div key={item.bookId + item.formatType} style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #ecf0f1', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#2c3e50' }}>{item.bookTitle}</p>
                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                                Format: <strong>{item.formatType}</strong> | Price: <strong>${item.price.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.bookId, item.formatType, Math.max(1, parseInt(e.target.value) || 0))}
                                                style={{ width: '50px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bdc3c7', textAlign: 'center' }}
                                            />
                                            <span style={{ color: '#2c3e50', fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                            <button
                                                className="btn btn-danger btn-small"
                                                onClick={() => removeFromCart(item.bookId, item.formatType)}
                                                style={{ padding: '0.4rem 0.8rem' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div style={{ height: 'fit-content', position: 'sticky', top: '80px' }}>
                        <div style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', border: '2px solid #e74c3c' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#2c3e50' }}>Order Summary</h3>

                            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #d5dbdb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#7f8c8d' }}>
                                    <span>Subtotal:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#27ae60', fontWeight: 'bold' }}>
                                        <span>Premium Discount ({PREMIUM_DISCOUNT}%):</span>
                                        <span>-${(subtotal - total).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                                <span>Total:</span>
                                <span style={{ color: '#e74c3c' }}>${total.toFixed(2)}</span>
                            </div>

                            {isPremium && (
                                <div style={{ backgroundColor: '#d5f4e6', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', borderLeft: '4px solid #2ecc71' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#27ae60', fontWeight: 'bold' }}>
                                        ✓ Premium member - {PREMIUM_DISCOUNT}% discount applied!
                                    </p>
                                </div>
                            )}

                            {hasPhysicalFormat && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107', borderLeft: '4px solid #ff9800' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#856404' }}>
                                        📦 Delivery Address Required
                                    </p>
                                    <textarea
                                        placeholder="Enter your delivery address (Street, City, Postal Code, etc.)"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '4px',
                                            border: '1px solid #ced4da',
                                            fontSize: '0.85rem',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                            minHeight: '80px',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <small style={{ display: 'block', color: '#666', marginTop: '0.25rem' }}>
                                        This address will be used for physical book delivery
                                    </small>
                                </div>
                            )}

                            <button
                                className="btn btn-primary"
                                onClick={handleCheckout}
                                disabled={loading}
                                style={{ width: '100%', padding: '0.8rem', marginBottom: '0.75rem', fontSize: '1rem' }}
                            >
                                {loading ? 'Processing...' : 'Checkout'}
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/books')}
                                style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
