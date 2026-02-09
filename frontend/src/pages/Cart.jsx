import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderAPI } from '../api'

export default function Cart() {
    const navigate = useNavigate()
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
    const { user } = useAuth()
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
                format_id: item.id,
                quantity: item.quantity
            }))

            await orderAPI.createOrder(items)
            setSuccess('Order placed successfully!')
            clearCart()
            setTimeout(() => {
                navigate('/orders')
            }, 2000)
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
                    <button className="btn btn-primary" onClick={() => navigate('/books')}>
                        Continue Shopping
                    </button>
                </div>
            </div>
        )
    }

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
                                <th>Format</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Subtotal</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.type}</td>
                                    <td>${item.price.toFixed(2)}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value)))}
                                            style={{
                                                width: '60px',
                                                padding: '0.5rem',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </td>
                                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-small"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div
                        style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '4px',
                            textAlign: 'right'
                        }}
                    >
                        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
                            Total: ${getTotalPrice().toFixed(2)}
                        </h2>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/books')}
                            >
                                Continue Shopping
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCheckout}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
