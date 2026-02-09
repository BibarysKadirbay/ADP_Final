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
                <button className="btn btn-secondary" onClick={() => navigate('/books')} style={{ marginBottom: '2rem' }}>
                    ← Back to Books
                </button>

                <div className="card" style={{ maxWidth: '600px' }}>
                    <h1 className="card-title">{book.title}</h1>
                    <p className="card-subtitle">by {book.author}</p>

                    <div style={{ margin: '1.5rem 0' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Description</h3>
                        <p>{book.description || 'No description available'}</p>
                    </div>

                    <div style={{ margin: '1.5rem 0' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Available Formats</h3>
                        {book.formats && book.formats.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {book.formats.map((format) => (
                                    <div
                                        key={format.id}
                                        style={{
                                            padding: '1rem',
                                            backgroundColor: '#f9f9f9',
                                            borderLeft: '4px solid #3498db'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.5rem'
                                            }}
                                        >
                                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {format.type}
                                            </span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#27ae60' }}>
                                                ${format.price.toFixed(2)}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                            Stock: {format.stock_quantity} available
                                        </p>
                                        {format.stock_quantity > 0 ? (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAddToCart(format)}
                                            >
                                                Add to Cart
                                            </button>
                                        ) : (
                                            <button className="btn btn-secondary" disabled>
                                                Out of Stock
                                            </button>
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
