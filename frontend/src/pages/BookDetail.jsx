import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookAPI } from '../api.jsx'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function BookDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [book, setBook] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { addToCart } = useCart()
    const { toggleWishlist, isInWishlist } = useWishlist()

    useEffect(() => {
        fetchBook()
    }, [id])

    const fetchBook = async () => {
        try {
            setLoading(true)
            const response = await bookAPI.getBookByID(id)
            setBook(response.data)
        } catch (err) {
            setError('Failed to fetch book details')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (format) => {
        addToCart(book, format)
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading book details...</p>
                </div>
            </div>
        )
    }

    if (error || !book) {
        return (
            <div className="page">
                <div className="container">
                    <div className="alert alert-danger">{error || 'Book not found'}</div>
                    <button className="btn btn-secondary" onClick={() => navigate('/books')}>Back to Books</button>
                </div>
            </div>
        )
    }

    const bid = book.id || book._id

    return (
        <div className="page">
            <div className="container">
                <button className="btn btn-secondary" onClick={() => navigate('/books')} style={{ marginBottom: '2rem' }}>← Back to Books</button>
                <div className="book-detail-card">
                    <div className="book-detail-image">
                        {book.image_url ? <img src={book.image_url} alt={book.title} /> : <div className="book-detail-placeholder">📖</div>}
                    </div>
                    <div className="book-detail-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h1 className="card-title" style={{ margin: 0 }}>{book.title}</h1>
                            <button
                                className={`btn btn-small ${isInWishlist(book) ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={() => toggleWishlist(book)}
                            >
                                {isInWishlist(book) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>
                        </div>
                        <p className="card-subtitle">by {book.author}</p>
                        {book.published_year && <p className="book-meta">Published: {book.published_year}</p>}
                        {book.isbn && <p className="book-meta">ISBN: {book.isbn}</p>}
                        {book.category && <p className="book-meta">Category: {book.category}</p>}
                        <div className="book-detail-desc">
                            <h3>Description</h3>
                            <p>{book.description || 'No description available'}</p>
                        </div>
                        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Available formats</h3>
                        {book.formats && book.formats.length > 0 ? (
                            <div className="book-detail-formats">
                                {book.formats.map((format) => (
                                    <div key={format.type} className="format-block">
                                        <div className="format-header">
                                            <span className="format-type">{format.type}</span>
                                            <span className="format-price">${format.price.toFixed(2)}</span>
                                        </div>
                                        <p className="format-stock">Stock: {format.stock_quantity}</p>
                                        {format.stock_quantity > 0 ? (
                                            <button className="btn btn-success" onClick={() => handleAddToCart(format)}>Add to Cart</button>
                                        ) : (
                                            <button className="btn btn-secondary" disabled>Out of Stock</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No formats available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
