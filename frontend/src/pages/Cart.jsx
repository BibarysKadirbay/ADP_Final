import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderAPI } from '../api.jsx'

const PREMIUM_DISCOUNT = 10

export default function Cart() {
    const navigate = useNavigate()
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
    const { user, isPremium } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login')
            return
        }
        if (cart.length === 0) {
            setError('Cart is empty')
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
            await orderAPI.createOrder(items)
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
                <div style={{ maxWidth: '800px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>Format</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item) => (
                                <tr key={item.bookId + item.formatType}>
                                    <td>{item.bookTitle}</td>
                                    <td>{item.formatType}</td>
                                    <td>${item.price.toFixed(2)}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.bookId, item.formatType, Math.max(1, parseInt(e.target.value) || 0))}
                                            style={{ width: '60px', padding: '0.5rem', fontSize: '0.9rem' }}
                                        />
                                    </td>
                                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                                    <td>
                                        <button className="btn btn-danger btn-small" onClick={() => removeFromCart(item.bookId, item.formatType)}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="cart-summary">
                        {discount > 0 && (
                            <p className="premium-discount">Premium {PREMIUM_DISCOUNT}% off: Subtotal ${subtotal.toFixed(2)} → <strong>${total.toFixed(2)}</strong></p>
                        )}
                        <h2>Total: ${total.toFixed(2)}</h2>
                        <div className="cart-actions">
                            <button className="btn btn-secondary" onClick={() => navigate('/books')}>Continue Shopping</button>
                            <button className="btn btn-primary" onClick={handleCheckout} disabled={loading}>{loading ? 'Processing...' : 'Checkout'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
