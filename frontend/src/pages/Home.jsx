import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookAPI } from '../api'
import { useCart } from '../context/CartContext'

export default function Home() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [searchInput, setSearchInput] = useState('')
    const [featuredBooks, setFeaturedBooks] = useState([])
    const [loadingBooks, setLoadingBooks] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchFeaturedBooks()
    }, [])

    const fetchFeaturedBooks = async () => {
        try {
            setLoadingBooks(true)
            setError('')
            const response = await bookAPI.getBooks('')
            setFeaturedBooks(response.data ? response.data.slice(0, 3) : [])
        } catch (err) {
            setError('Failed to load featured books')
            console.error(err)
        } finally {
            setLoadingBooks(false)
        }
    }

    const handleSearch = () => {
        if (searchInput.trim()) {
            navigate(`/books?search=${encodeURIComponent(searchInput)}`)
        } else {
            navigate('/books')
        }
    }

    const handleAddToCart = (format) => {
        addToCart(format)
        alert(`${format.type} format added to cart!`)
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 120px)' }}>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div>
                        <h1 className="hero-title">📚 Welcome to Bookstore</h1>
                        <p className="hero-subtitle">Discover your next favorite book across Physical, Digital, and Audio formats</p>
                        <div className="hero-search" style={{ marginTop: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                            <input 
                                type="search" 
                                placeholder="Find your favorite book here..." 
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '300px', fontSize: '1rem' }}
                            />
                            <button 
                                className="btn btn-success"
                                onClick={handleSearch}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="hero-image" aria-hidden="true">
                            {/* Decorative image block — replace with illustration if available */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Books Section */}
            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 className="page-title">Featured Books</h2>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/books')}
                    >
                        View All
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loadingBooks ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading featured books...</p>
                    </div>
                ) : featuredBooks.length === 0 ? (
                    <div className="alert alert-info">No books available at the moment.</div>
                ) : (
                    <div className="grid grid-3">
                        {featuredBooks.map((book) => (
                            <div key={book.id} className="card">
                                <Link to={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <h3 className="card-title">{book.title}</h3>
                                    <p className="card-subtitle">{book.author}</p>
                                </Link>

                                <p className="card-description">
                                    {book.description ? book.description.substring(0, 100) + '...' : 'No description available'}
                                </p>

                                {book.formats && book.formats.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Available Formats:</p>
                                        <div className="format-list">
                                            {book.formats.map((format) => (
                                                <div key={format.id} className="format-item">
                                                    <div>
                                                        <strong>{format.type}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <div className="price">${format.price.toFixed(2)}</div>
                                                        {format.stock_quantity > 0 && (
                                                            <button className="btn btn-success btn-small" onClick={() => handleAddToCart(format)}>Add</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="card-footer">
                                    <Link to={`/books/${book.id}`} className="btn btn-primary btn-small">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Why Choose Our Bookstore Section */}
            <div className="container" style={{ padding: '4rem 0' }}>
                <h2 className="page-title" style={{ textAlign: 'center' }}>Why Choose Our Bookstore?</h2>

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
                        <h3 className="card-title">💳 Secure Checkout</h3>
                        <p className="card-description">
                            Shop with confidence with our secure payment and order management system.
                        </p>
                    </div>
                </div>
            </div>

            {/* Admin Panel Section */}
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
