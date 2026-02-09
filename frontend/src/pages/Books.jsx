import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookAPI } from '../api.jsx'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function Books() {
    const [books, setBooks] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { addToCart } = useCart()
    const { toggleWishlist, isInWishlist } = useWishlist()

    useEffect(() => {
        fetchBooks()
    }, [search])

    const fetchBooks = async () => {
        try {
            setLoading(true)
            const response = await bookAPI.getBooks(search ? { search } : {})
            setBooks(response.data || [])
        } catch (err) {
            setError('Failed to fetch books')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (e, book, format) => {
        e.preventDefault()
        e.stopPropagation()
        addToCart(book, format)
    }

    const bid = (b) => b.id || b._id

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Bookstore Catalog</h1>
                <div className="form-group" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading books...</p>
                    </div>
                ) : books.length === 0 ? (
                    <div className="alert alert-info">No books found.</div>
                ) : (
                    <>
                        {books.length > 0 && (() => {
                            const sorted = [...books].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                            const newArrivals = sorted.slice(0, 6)
                            return newArrivals.length > 0 && (
                                <section className="new-arrivals" style={{ marginBottom: '2rem' }}>
                                    <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>New Arrivals</h2>
                                    <div className="grid grid-3">
                                        {newArrivals.map((book) => (
                                            <div key={bid(book)} className="card book-card">
                                                <span className="new-badge">New</span>
                                                <Link to={`/books/${bid(book)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <div className="book-card-image">
                                                        {book.image_url ? <img src={book.image_url} alt={book.title} /> : <div className="book-card-placeholder">📖</div>}
                                                    </div>
                                                    <h3 className="card-title">{book.title}</h3>
                                                    <p className="card-subtitle">{book.author}</p>
                                                    {book.published_year && <span className="book-year">{book.published_year}</span>}
                                                </Link>
                                                <div className="card-footer">
                                                    <button className="btn btn-secondary btn-small" onClick={() => toggleWishlist(book)}>{isInWishlist(book) ? 'In Wishlist' : 'Wishlist'}</button>
                                                    <Link to={`/books/${bid(book)}`} className="btn btn-primary btn-small">View</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        })()}
                        <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>All Books</h2>
                    <div className="grid grid-3">
                        {books.map((book) => (
                            <div key={bid(book)} className="card book-card">
                                <Link to={`/books/${bid(book)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="book-card-image">
                                        {book.image_url ? (
                                            <img src={book.image_url} alt={book.title} />
                                        ) : (
                                            <div className="book-card-placeholder">📖</div>
                                        )}
                                    </div>
                                    <h3 className="card-title">{book.title}</h3>
                                    <p className="card-subtitle">{book.author}</p>
                                    {book.published_year && <span className="book-year">{book.published_year}</span>}
                                </Link>
                                <button className="btn btn-small wishlist-btn" onClick={() => toggleWishlist(book)} style={{ marginTop: '0.5rem' }}>{isInWishlist(book) ? '♥ In Wishlist' : '♡ Wishlist'}</button>
                                <p className="card-description">
                                    {book.description ? book.description.substring(0, 80) + '...' : 'No description'}
                                </p>
                                {book.formats && book.formats.length > 0 && (
                                    <div className="book-formats">
                                        {book.formats.map((f) => (
                                            <div key={f.type} className="book-format-row">
                                                <span>{f.type} ${f.price.toFixed(2)}</span>
                                                {f.stock_quantity > 0 && (
                                                    <button
                                                        className="btn btn-success btn-small"
                                                        onClick={(e) => handleAddToCart(e, book, f)}
                                                    >
                                                        Add
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="card-footer">
                                    <Link to={`/books/${bid(book)}`} className="btn btn-primary btn-small">View Details</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>
    )
}
