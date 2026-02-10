import React, { useState, useEffect } from 'react'
import { digitalAPI } from '../api.jsx'

export default function Library() {
    const [library, setLibrary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchLibrary()
    }, [])

    const fetchLibrary = async () => {
        try {
            setLoading(true)
            const response = await digitalAPI.getPersonalLibrary()
            setLibrary(response.data)
        } catch (err) {
            setError('Failed to fetch your library')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading your library...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <h1 className="page-title">My Digital Library</h1>

                {error && <div className="alert alert-danger">{error}</div>}

                {!library || library.books.length === 0 ? (
                    <div className="alert alert-info">
                        Your library is empty. Purchase digital or audio books to access them here!
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {library.books.map((book) => (
                            <div key={book.id} className="card">
                                <h3 className="card-title">{book.book_title}</h3>
                                <p className="card-subtitle">{book.book_author}</p>

                                <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                        <strong>Format:</strong> {book.format}
                                    </p>
                                    <p style={{ fontSize: '0.9rem' }}>
                                        <strong>Accessed:</strong> {new Date(book.accessed_date).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="card-footer">
                                    {book.access_url ? (
                                        <a
                                            href={book.access_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-small"
                                        >
                                            Access Now
                                        </a>
                                    ) : (
                                        <button className="btn btn-secondary btn-small" disabled>Not available</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
