import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookAPI } from '../api.jsx'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

export default function Wishlist() {
    const { wishlistIds, removeFromWishlist } = useWishlist()
    const { addToCart } = useCart()
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (wishlistIds.length === 0) {
            setBooks([])
            setLoading(false)
            return
        }
        Promise.all(wishlistIds.map(id => bookAPI.getBookByID(id).then(r => r.data).catch(() => null)))
            .then(results => setBooks(results.filter(Boolean)))
            .finally(() => setLoading(false))
    }, [wishlistIds.join(',')])

    const bid = (b) => b.id || b._id

    if (loading) {
        return (
            <div className="page">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        )
    }

    if (wishlistIds.length === 0) {
        return (
            <div className="page">
                <div className="container">
                    <h1 className="page-title">Wishlist</h1>
                    <div className="alert alert-info">Your wishlist is empty. Add books from the catalog.</div>
                    <Link to="/books" className="btn btn-primary">Browse Catalog</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">Wishlist</h1>
                <div className="grid grid-3">
                    {books.map((book) => (
                        <div key={bid(book)} className="card book-card">
                            <Link to={`/books/${bid(book)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="book-card-image">
                                    {book.image_url ? <img src={book.image_url} alt={book.title} /> : <div className="book-card-placeholder">📖</div>}
                                </div>
                                <h3 className="card-title">{book.title}</h3>
                                <p className="card-subtitle">{book.author}</p>
                                {book.published_year && <span className="book-year">{book.published_year}</span>}
                            </Link>
                            {book.formats && book.formats.length > 0 && (
                                <div className="book-formats">
                                    {book.formats.slice(0, 2).map((f) => (
                                        f.stock_quantity > 0 && (
                                            <button
                                                key={f.type}
                                                className="btn btn-success btn-small"
                                                onClick={() => addToCart(book, f)}
                                            >
                                                Add {f.type}
                                            </button>
                                        )
                                    ))}
                                </div>
                            )}
                            <div className="card-footer">
                                <button className="btn btn-danger btn-small" onClick={() => removeFromWishlist(bid(book))}>Remove from Wishlist</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
