import React, { useState, useEffect } from 'react'
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

    // Delivery Address Form State
    const [deliveryForm, setDeliveryForm] = useState({
        fullName: '',
        streetAddress: '',
        city: '',
        postalCode: '',
        phoneNumber: ''
    })

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    })

    // Field Errors State
    const [fieldErrors, setFieldErrors] = useState({
        delivery: {},
        payment: {}
    })

    // Validation Functions
    const validateCardNumber = (cardNumber) => {
        const cleaned = cardNumber.replace(/\s/g, '')
        if (cleaned.length !== 16) return false
        if (!/^\d+$/.test(cleaned)) return false
        
        // Check if it's Visa or Mastercard format
        const isVisa = /^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)
        const isMastercard = /^5[1-5][0-9]{14}$/.test(cleaned)
        
        return isVisa || isMastercard
    }

    const validateExpiryDate = (expiryDate) => {
        const regex = /^(0[1-9]|1[0-2])\/\d{2}$/
        if (!regex.test(expiryDate)) return false
        
        const [month, year] = expiryDate.split('/')
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear() % 100
        const currentMonth = currentDate.getMonth() + 1
        
        const expiryYear = parseInt(year)
        const expiryMonth = parseInt(month)
        
        if (expiryYear < currentYear) return false
        if (expiryYear === currentYear && expiryMonth < currentMonth) return false
        
        return true
    }

    const validateCVV = (cvv) => {
        return /^[0-9]{3}$/.test(cvv)
    }

    const validateDeliveryForm = () => {
        const errors = {}
        
        if (!deliveryForm.fullName.trim()) {
            errors.fullName = 'Full name is required'
        }
        if (!deliveryForm.streetAddress.trim()) {
            errors.streetAddress = 'Street address is required'
        }
        if (!deliveryForm.city.trim()) {
            errors.city = 'City is required'
        }
        if (!deliveryForm.postalCode.trim()) {
            errors.postalCode = 'Postal code is required'
        }
        if (!deliveryForm.phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required'
        } else if (!/^[\d\s\-\+\(\)]+$/.test(deliveryForm.phoneNumber)) {
            errors.phoneNumber = 'Invalid phone number format'
        }
        
        setFieldErrors(prev => ({ ...prev, delivery: errors }))
        return Object.keys(errors).length === 0
    }

    const validatePaymentForm = () => {
        const errors = {}
        
        if (!paymentForm.cardholderName.trim()) {
            errors.cardholderName = 'Cardholder name is required'
        }
        if (!validateCardNumber(paymentForm.cardNumber)) {
            errors.cardNumber = 'Invalid card number (must be 16 digit Visa or Mastercard)'
        }
        if (!validateExpiryDate(paymentForm.expiryDate)) {
            errors.expiryDate = 'Invalid expiry date (use MM/YY format, must be valid future date)'
        }
        if (!validateCVV(paymentForm.cvv)) {
            errors.cvv = 'CVV must be 3 digits'
        }
        
        setFieldErrors(prev => ({ ...prev, payment: errors }))
        return Object.keys(errors).length === 0
    }

    const handleDeliveryChange = (e) => {
        const { name, value } = e.target
        setDeliveryForm(prev => ({ ...prev, [name]: value }))
        // Clear error for this field when user starts typing
        if (fieldErrors.delivery[name]) {
            setFieldErrors(prev => ({
                ...prev,
                delivery: { ...prev.delivery, [name]: '' }
            }))
        }
    }

    const handlePaymentChange = (e) => {
        let { name, value } = e.target
        
        // Format card number with spaces (every 4 digits)
        if (name === 'cardNumber') {
            value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
        }
        
        // Format expiry date MM/YY
        if (name === 'expiryDate') {
            value = value.replace(/\D/g, '').slice(0, 4)
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4)
            }
        }
        
        // CVV - only numbers
        if (name === 'cvv') {
            value = value.replace(/\D/g, '').slice(0, 3)
        }
        
        setPaymentForm(prev => ({ ...prev, [name]: value }))
        // Clear error for this field when user starts typing
        if (fieldErrors.payment[name]) {
            setFieldErrors(prev => ({
                ...prev,
                payment: { ...prev.payment, [name]: '' }
            }))
        }
    }

    const handleCheckout = async () => {
        if (!user) {
            navigate('/login')
            return
        }

        if (cart.length === 0) {
            setError('Cart is empty')
            return
        }

        // Validate all forms
        if (!validateDeliveryForm() || !validatePaymentForm()) {
            setError('Please fix all validation errors before checkout')
            window.scrollTo(0, 0)
            return
        }

        setLoading(true)
        setError('')

        try {
            const items = cart.map((item) => ({
                format_id: item.id,
                quantity: item.quantity
            }))

            // In production, payment would be processed on the backend
            // For now, we'll just create the order with delivery info
            await orderAPI.createOrder(items)
            setSuccess('Order placed successfully!')
            clearCart()
            setTimeout(() => {
                navigate('/orders')
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to place order. Please try again.')
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

    const totalPrice = getTotalPrice()

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Shopping Cart</h1>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }}>
                    {/* Left Column - Cart Items and Forms */}
                    <div>
                        {/* Cart Items Section */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Order Items</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Format</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Price</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Qty</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Subtotal</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '2px solid #ddd' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item) => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '0.75rem', textAlign: 'left' }}>{item.type}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                                                        style={{
                                                            width: '50px',
                                                            padding: '0.5rem',
                                                            fontSize: '0.9rem',
                                                            border: '1px solid #ddd',
                                                            borderRadius: '4px',
                                                            textAlign: 'center'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    <button
                                                        className="btn btn-danger btn-small"
                                                        onClick={() => removeFromCart(item.id)}
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Delivery Address Section */}
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>Delivery Address</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="fullName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        name="fullName"
                                        value={deliveryForm.fullName}
                                        onChange={handleDeliveryChange}
                                        placeholder="John Doe"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.delivery.fullName ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.delivery.fullName ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.delivery.fullName && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.delivery.fullName}
                                        </div>
                                    )}
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label htmlFor="phoneNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Phone Number *
                                    </label>
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        name="phoneNumber"
                                        value={deliveryForm.phoneNumber}
                                        onChange={handleDeliveryChange}
                                        placeholder="+1 (555) 123-4567"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.delivery.phoneNumber ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.delivery.phoneNumber ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.delivery.phoneNumber && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.delivery.phoneNumber}
                                        </div>
                                    )}
                                </div>

                                {/* Street Address - Full Width */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="streetAddress" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Street Address *
                                    </label>
                                    <input
                                        id="streetAddress"
                                        type="text"
                                        name="streetAddress"
                                        value={deliveryForm.streetAddress}
                                        onChange={handleDeliveryChange}
                                        placeholder="123 Main Street, Apt 4B"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.delivery.streetAddress ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.delivery.streetAddress ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.delivery.streetAddress && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.delivery.streetAddress}
                                        </div>
                                    )}
                                </div>

                                {/* City */}
                                <div>
                                    <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        City *
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        value={deliveryForm.city}
                                        onChange={handleDeliveryChange}
                                        placeholder="New York"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.delivery.city ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.delivery.city ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.delivery.city && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.delivery.city}
                                        </div>
                                    )}
                                </div>

                                {/* Postal Code */}
                                <div>
                                    <label htmlFor="postalCode" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Postal Code *
                                    </label>
                                    <input
                                        id="postalCode"
                                        type="text"
                                        name="postalCode"
                                        value={deliveryForm.postalCode}
                                        onChange={handleDeliveryChange}
                                        placeholder="10001"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.delivery.postalCode ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.delivery.postalCode ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.delivery.postalCode && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.delivery.postalCode}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Information Section */}
                        <div style={{ padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>Payment Information</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {/* Cardholder Name */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="cardholderName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Cardholder Name *
                                    </label>
                                    <input
                                        id="cardholderName"
                                        type="text"
                                        name="cardholderName"
                                        value={paymentForm.cardholderName}
                                        onChange={handlePaymentChange}
                                        placeholder="John Doe"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.payment.cardholderName ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            backgroundColor: fieldErrors.payment.cardholderName ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.payment.cardholderName && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.payment.cardholderName}
                                        </div>
                                    )}
                                </div>

                                {/* Card Number */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="cardNumber" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Card Number (Visa/Mastercard) *
                                    </label>
                                    <input
                                        id="cardNumber"
                                        type="text"
                                        name="cardNumber"
                                        value={paymentForm.cardNumber}
                                        onChange={handlePaymentChange}
                                        placeholder="4532 1234 5678 9010"
                                        maxLength="19"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.payment.cardNumber ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            letterSpacing: '0.1em',
                                            backgroundColor: fieldErrors.payment.cardNumber ? '#fff5f5' : '#fff',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    {fieldErrors.payment.cardNumber && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.payment.cardNumber}
                                        </div>
                                    )}
                                </div>

                                {/* Expiry Date */}
                                <div>
                                    <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        Expiry Date (MM/YY) *
                                    </label>
                                    <input
                                        id="expiryDate"
                                        type="text"
                                        name="expiryDate"
                                        value={paymentForm.expiryDate}
                                        onChange={handlePaymentChange}
                                        placeholder="12/25"
                                        maxLength="5"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.payment.expiryDate ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            fontFamily: 'monospace',
                                            backgroundColor: fieldErrors.payment.expiryDate ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.payment.expiryDate && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.payment.expiryDate}
                                        </div>
                                    )}
                                </div>

                                {/* CVV */}
                                <div>
                                    <label htmlFor="cvv" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                        CVV *
                                    </label>
                                    <input
                                        id="cvv"
                                        type="text"
                                        name="cvv"
                                        value={paymentForm.cvv}
                                        onChange={handlePaymentChange}
                                        placeholder="123"
                                        maxLength="3"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            fontSize: '1rem',
                                            border: fieldErrors.payment.cvv ? '2px solid #dc3545' : '1px solid #ddd',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box',
                                            fontFamily: 'monospace',
                                            backgroundColor: fieldErrors.payment.cvv ? '#fff5f5' : '#fff'
                                        }}
                                    />
                                    {fieldErrors.payment.cvv && (
                                        <div style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                            {fieldErrors.payment.cvv}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div style={{ '@media (max-width: 768px)': { order: -1 } }}>
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '2px solid #007bff',
                            position: 'sticky',
                            top: '20px'
                        }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>Order Summary</h2>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    <span>Item Count:</span>
                                    <span style={{ fontWeight: 'bold' }}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.75rem',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid #eee'
                                }}>
                                    <span>Total Quantity:</span>
                                    <span style={{ fontWeight: 'bold' }}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '1.3rem',
                                    fontWeight: 'bold',
                                    color: '#007bff',
                                    paddingTop: '0.75rem'
                                }}>
                                    <span>Order Total:</span>
                                    <span>${totalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Place Order'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/books')}
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        fontSize: '1rem',
                                        opacity: loading ? 0.7 : 1,
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Continue Shopping
                                </button>
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f8ff', borderRadius: '4px', fontSize: '0.9rem', color: '#004085', borderLeft: '4px solid #007bff' }}>
                                <strong>Note:</strong> All fields marked with * are required. Please review your information before placing the order.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile-specific responsive styles */}
            <style>{`
                @media (max-width: 768px) {
                    .cart-container {
                        grid-template-columns: 1fr;
                    }

                    table {
                        font-size: 0.9rem;
                    }

                    input[type="text"],
                    input[type="tel"],
                    input[type="number"] {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    )
}
