import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookAPI } from '../api'
import { useCart } from '../context/CartContext'

export default function Books() {
    const [books, setBooks] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { addToCart } = useCart()

    useEffect(() => {
        fetchBooks()
    }, [search])

    const fetchBooks = async () => {
        try {
            setLoading(true)
            const response = await bookAPI.getBooks(search)
            setBooks(response.data || [])
        } catch (err) {
            setError('Failed to fetch books')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (format) => {
        addToCart(format)
        alert(`${format.type} format added to cart!`)
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Bookstore Catalog</h1>

                <div className="form-group" style={{ maxWidth: '480px', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="Search books by title or author..."
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
                    <div className="alert alert-info">No books found. Try a different search.</div>
                ) : (
                    <div className="grid grid-3">
                        {books.map((book) => (
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
        </div>
    )
}
