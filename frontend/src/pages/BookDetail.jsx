import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookAPI } from '../api'
import { useCart } from '../context/CartContext'

export default function BookDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [book, setBook] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { addToCart } = useCart()

    useEffect(() => {
        fetchBook()
    }, [id])

    const fetchBook = async () => {
        try {
            setLoading(true)
            const response = await bookAPI.getBook(id)
            setBook(response.data)
        } catch (err) {
            setError('Failed to fetch book details')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (format) => {
        addToCart(format)
        alert(`${format.type} format added to cart!`)
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
                    <button className="btn btn-secondary" onClick={() => navigate('/books')}>
                        Back to Books
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <button className="btn btn-secondary" onClick={() => navigate('/books')} style={{ marginBottom: '2rem' }}>← Back to Books</button>

                <div className="card" style={{ maxWidth: '800px' }}>
                    <div className="card-hero">
                        <div style={{ flex: 1 }}>
                            <h1 className="card-title">{book.title}</h1>
                            <p className="card-subtitle">by {book.author}</p>

                            <div style={{ margin: '1rem 0' }}>
                                <h3>Description</h3>
                                <p>{book.description || 'No description available'}</p>
                            </div>
                        </div>

                        <aside style={{ width: '260px' }}>
                            <div className="card" style={{ padding: '1rem' }}>
                                <h4 className="muted">Available Formats</h4>
                                {book.formats && book.formats.length > 0 ? (
                                    <div className="format-list">
                                        {book.formats.map((format) => (
                                            <div key={format.id} className="format-item">
                                                <div>
                                                    <strong>{format.type}</strong>
                                                    <div className="muted" style={{ fontSize: '0.85rem' }}>Stock: {format.stock_quantity}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <div className="price">${format.price.toFixed(2)}</div>
                                                    {format.stock_quantity > 0 ? (
                                                        <button className="btn btn-success" onClick={() => handleAddToCart(format)}>Add</button>
                                                    ) : (
                                                        <button className="btn btn-secondary" disabled>Out of Stock</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No formats available</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    )
}
