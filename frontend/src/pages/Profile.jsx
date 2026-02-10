import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI, userAPI } from '../api.jsx'

export default function Profile() {
    const { user, loading } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [message, setMessage] = useState('')
    const [formData, setFormData] = useState({
        username: '',
        email: '',
    })

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
            })
        }
    }, [user])

    if (loading) return <div className="page"><div className="container"><p>Loading profile...</p></div></div>
    if (!user) return <div className="page"><div className="container"><p>Please login to see your profile.</p></div></div>

    const handleEditToggle = () => {
        if (isEditing) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
            })
        }
        setIsEditing(!isEditing)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSaveProfile = async () => {
        if (!formData.username || !formData.email) {
            setMessage('Username and email are required')
            return
        }
        setProcessing(true)
        setMessage('')
        try {
            await authAPI.updateProfile(formData.username, formData.email)
            setMessage('Profile updated successfully')
            setIsEditing(false)
            window.location.reload()
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to update profile')
        } finally {
            setProcessing(false)
        }
    }

    const handleBuyPremium = async () => {
        const confirmed = window.confirm(
            '🌟 Upgrade to Premium\n\n' +
            'Cost: $22.00 per month\n\n' +
            'Benefits:\n' +
            '✓ 10% discount on all purchases\n' +
            '✓ Free shipping on orders\n' +
            '✓ Priority customer support\n' +
            '✓ Exclusive deals and offers\n\n' +
            'Click OK to proceed with payment.'
        )
        if (!confirmed) return

        setProcessing(true)
        setMessage('')
        try {
            await userAPI.purchasePremium()
            setMessage('✓ Premium membership activated! Your 30-day premium subscription has started.')
            setTimeout(() => window.location.reload(), 2000)
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to purchase premium')
        } finally {
            setProcessing(false)
        }
    }

    const handleCancelPremium = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to cancel your premium membership?\n\n' +
            'Your premium benefits will be available until: ' +
            (user.premium_until ? new Date(user.premium_until).toLocaleDateString() : 'N/A') +
            '\n\n' +
            'You can reactivate anytime.'
        )
        if (!confirmed) return

        setProcessing(true)
        setMessage('')
        try {
            // Call cancel premium API (we need to create this endpoint)
            await userAPI.cancelPremium()
            setMessage('✓ Your premium membership has been cancelled.')
            setTimeout(() => window.location.reload(), 2000)
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to cancel premium')
        } finally {
            setProcessing(false)
        }
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin':
                return '#e74c3c'
            case 'Moderator':
                return '#9b59b6'
            default:
                return '#95a5a6'
        }
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">My Profile</h1>
                {message && <div className="alert alert-info">{message}</div>}

                <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    {isEditing ? (
                        <div>
                            <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
                                Edit Profile
                            </h3>

                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Enter username"
                                    style={{ marginBottom: '1rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email"
                                    style={{ marginBottom: '1.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSaveProfile}
                                    disabled={processing}
                                    style={{ flex: 1 }}
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleEditToggle}
                                    disabled={processing}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #ecf0f1' }}>
                                <h2 style={{ margin: 0, color: '#2c3e50' }}>{user.username}</h2>
                                <button className="btn btn-primary" onClick={handleEditToggle}>
                                    Edit Profile
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                <p style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ color: '#2c3e50' }}>Email:</strong>
                                    <span style={{ marginLeft: '0.5rem', color: '#555' }}>{user.email}</span>
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Role:</span>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        backgroundColor: getRoleBadgeColor(user.role),
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {user.role}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Premium:</span>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        padding: '0.3rem 0.8rem',
                                        borderRadius: '20px',
                                        backgroundColor: user.is_premium ? '#2ecc71' : '#95a5a6',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {user.is_premium ? '✓ Premium' : 'Standard'}
                                </span>
                            </div>

                            {user.loyalty_level && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Loyalty Level:</span>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '20px',
                                            backgroundColor: user.loyalty_level === 'Platinum' ? '#E5E4E2' : user.loyalty_level === 'Gold' ? '#FFD700' : user.loyalty_level === 'Silver' ? '#C0C0C0' : '#A0826D',
                                            color: user.loyalty_level === 'Gold' ? '#333' : 'white',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {user.loyalty_level} ({user.loyalty_points || 0} points)
                                    </span>
                                </div>
                            )}

                            {user.loyalty_discount > 0 && (
                                <div style={{ padding: '0.8rem', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '1.5rem', borderLeft: '4px solid #ffc107' }}>
                                    <p style={{ margin: 0, color: '#664d03', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        🎁 Loyalty Discount: {(user.loyalty_discount * 100).toFixed(0)}% off your next order!
                                    </p>
                                </div>
                            )}

                            {user.is_premium && (
                                <div>
                                    <div style={{ padding: '1.2rem', backgroundColor: '#d5f4e6', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #2ecc71', border: '2px solid #2ecc71' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#27ae60', fontSize: '0.9rem' }}>
                                            <strong>🌟 Premium Member</strong>
                                        </p>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#27ae60', fontSize: '0.85rem' }}>
                                            Premium until: <strong>{new Date(user.premium_until).toLocaleDateString()}</strong>
                                        </p>
                                        <p style={{ margin: 0, color: '#27ae60', fontSize: '0.85rem' }}>
                                            Current benefit: 10% discount on all purchases
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleCancelPremium}
                                        disabled={processing}
                                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
                                    >
                                        {processing ? 'Processing...' : 'Cancel Premium Membership'}
                                    </button>
                                </div>
                            )}

                            {!user.is_premium && (
                                <div>
                                    <div style={{ padding: '1rem', backgroundColor: '#e8f4f8', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #3498db' }}>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#2c5aa0', fontWeight: 'bold' }}>
                                            💎 Upgrade to Premium - Only $22/month
                                        </p>
                                        <p style={{ margin: 0, color: '#2c5aa0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                            ✓ 10% discount on all purchases<br />
                                            ✓ Free shipping on orders<br />
                                            ✓ Priority customer support<br />
                                            ✓ Exclusive deals and offers
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-success"
                                        onClick={handleBuyPremium}
                                        disabled={processing}
                                        style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 'bold' }}
                                    >
                                        {processing ? 'Processing...' : 'Upgrade to Premium - $22/month'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

