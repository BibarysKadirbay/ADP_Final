import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
    const navigate = useNavigate()
    const { user } = useAuth()

    return (
        <div style={{ minHeight: 'calc(100vh - 120px)', backgroundColor: '#ecf0f1' }}>
            <div
                style={{
                    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                    color: 'white',
                    padding: '4rem 2rem',
                    textAlign: 'center'
                }}
            >
                <div className="container">
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        📚 Welcome to Bookstore
                    </h1>
                    <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
                        Discover your next favorite book across Physical, Digital, and Audio formats
                    </p>
                    {user ? (
                        <button
                            className="btn btn-success"
                            onClick={() => navigate('/books')}
                            style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                        >
                            Browse Catalog
                        </button>
                    ) : (
                        <div>
                            <button
                                className="btn btn-success"
                                onClick={() => navigate('/login')}
                                style={{ fontSize: '1.1rem', padding: '1rem 2rem', marginRight: '1rem' }}
                            >
                                Login
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/register')}
                                style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="container" style={{ padding: '4rem 0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#2c3e50' }}>
                    Why Choose Our Bookstore?
                </h2>

                <div className="grid grid-3">
                    <div className="card">
                        <h3 className="card-title">📖 Diverse Formats</h3>
                        <p className="card-description">
                            Choose from Physical books, Digital ebooks, and Audio books to suit your lifestyle.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title">🔍 Smart Search</h3>
                        <p className="card-description">
                            Easily search and filter thousands of books by title, author, and more.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title">📚 Personal Library</h3>
                        <p className="card-description">
                            Access your digital and audio books anytime, anywhere from your personal library.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title">💳 Secure Checkout</h3>
                        <p className="card-description">
                            Shop with confidence with our secure payment and order management system.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title">⚡ Fast Delivery</h3>
                        <p className="card-description">
                            Instant access to digital books and audio content, shipped books delivered fast.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="card-title">👥 Community</h3>
                        <p className="card-description">
                            Join thousands of readers and manage your orders easily.
                        </p>
                    </div>
                </div>
            </div>

            {user && user.role === 'Admin' && (
                <div style={{ backgroundColor: '#fff3cd', padding: '2rem', marginTop: '2rem' }}>
                    <div className="container">
                        <h2 style={{ color: '#856404', marginBottom: '1rem' }}>Admin Panel</h2>
                        <p style={{ color: '#856404', marginBottom: '1rem' }}>
                            You have administrator privileges. Manage books, orders, and users from your dashboard.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/admin')}
                        >
                            Go to Admin Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
