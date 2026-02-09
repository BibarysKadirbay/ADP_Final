import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

export default function Home() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="landing-hero">
                <div className="hero-content">
                    <h1>Welcome to Bookstore</h1>
                    <p>Discover your next favorite book across Physical, Digital, formats</p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => navigate('/login')}>
                            Login
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/register')}>
                            Register
                        </button>
                    </div>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <h3>📚 Diverse Formats</h3>
                        <p>Choose from Physical books, Digital ebooks to suit your lifestyle.</p>
                    </div>
                    <div className="feature-card">
                        <h3>🔍 Smart Search</h3>
                        <p>Easily search and filter thousands of books by title, author, and more.</p>
                    </div>
                    <div className="feature-card">
                        <h3>📖 Personal Library</h3>
                        <p>Access your digital books anytime, anywhere from your personal library.</p>
                    </div>
                    <div className="feature-card">
                        <h3>🛒 Secure Checkout</h3>
                        <p>Shop with confidence with our secure payment and order management system.</p>
                    </div>
                    <div className="feature-card">
                        <h3>⚡ Fast Delivery</h3>
                        <p>Instant access to digital books, shipped books delivered fast.</p>
                    </div>
                    <div className="feature-card">
                        <h3>⭐ Premium Access</h3>
                        <p>Get exclusive premium features, discounts and early access to new releases.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-dashboard">
            <div className="welcome-section">
                <h1>Welcome, {user.username}!</h1>
                <p>Continue your reading journey</p>
            </div>

            <div className="quick-actions">
                <button className="action-btn" onClick={() => navigate('/books')}>
                    📚 Browse Catalog
                </button>
                <button className="action-btn" onClick={() => navigate('/orders')}>
                    📋 My Orders
                </button>
                <button className="action-btn" onClick={() => navigate('/library')}>
                    📖 Digital Library
                </button>
                <button className="action-btn" onClick={() => navigate('/cart')}>
                    🛒 Shopping Cart
                </button>
            </div>

            {(user.role === 'Admin' || user.role === 'Moderator') && (
                <div className="admin-section">
                    <h2>Dashboard</h2>
                    <button className="admin-btn" onClick={() => navigate('/admin')}>
                        Go to Dashboard
                    </button>
                </div>
            )}

            {user.is_premium && (
                <div className="premium-badge">
                    <p>✨ Premium Member until {new Date(user.premium_until).toLocaleDateString()}</p>
                </div>
            )}
        </div>
    );
}
