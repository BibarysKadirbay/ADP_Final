import React, { useState, useEffect, useMemo } from 'react'
import { digitalAPI } from '../api'
import '../styles.css'

const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
        case 'physical':
            return '📖'
        case 'digital':
            return '📱'
        case 'audio':
            return '🎧'
        default:
            return '📚'
    }
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return 'N/A'
    }
}

export default function Library() {
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterFormat, setFilterFormat] = useState('All')
    const [sortBy, setSortBy] = useState('Recent')

    useEffect(() => {
        fetchLibrary()
    }, [])

    const fetchLibrary = async () => {
        try {
            setLoading(true)
            setError('')
            const response = await digitalAPI.getLibrary()
            setBooks(response.data?.books || [])
        } catch (err) {
            setError('Failed to fetch your library. Please try again later.')
            setBooks([])
        } finally {
            setLoading(false)
        }
    }

    // Filter books by format
    const filteredBooks = useMemo(() => {
        if (filterFormat === 'All') return books
        return books.filter((book) => book.format?.toLowerCase() === filterFormat.toLowerCase())
    }, [books, filterFormat])

    // Sort books
    const sortedBooks = useMemo(() => {
        const sorted = [...filteredBooks]
        switch (sortBy) {
            case 'Title':
                sorted.sort((a, b) => (a.book_title || '').localeCompare(b.book_title || ''))
                break
            case 'Author':
                sorted.sort((a, b) => (a.book_author || '').localeCompare(b.book_author || ''))
                break
            case 'Recent':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.accessed_date || 0)
                    const dateB = new Date(b.accessed_date || 0)
                    return dateB - dateA
                })
                break
        }
        return sorted
    }, [filteredBooks, sortBy])

    // Format-specific action button factory
    const renderActions = (book) => {
        const format = book.format?.toLowerCase()
        const baseBtn = 'btn btn-small'

        switch (format) {
            case 'physical':
                return (
                    <div className="action-buttons">
                        <button className={`${baseBtn} btn-primary`} onClick={() => handleTrackShipment(book.id)}>
                            📦 Track Shipment
                        </button>
                    </div>
                )
            case 'digital':
                return (
                    <div className="action-buttons">
                        <button className={`${baseBtn} btn-primary`} onClick={() => handleReadOnline(book.id)}>
                            📖 Read Online
                        </button>
                        <button className={`${baseBtn} btn-secondary`} onClick={() => handleDownload(book.id)}>
                            ⬇️ Download
                        </button>
                    </div>
                )
            case 'audio':
                return (
                    <div className="action-buttons">
                        <button className={`${baseBtn} btn-primary`} onClick={() => handleListenOnline(book.id)}>
                            🎧 Listen Online
                        </button>
                        <button className={`${baseBtn} btn-secondary`} onClick={() => handleDownload(book.id)}>
                            ⬇️ Download
                        </button>
                    </div>
                )
            default:
                return (
                    <button className={`${baseBtn} btn-primary`} onClick={() => handleReadOnline(book.id)}>
                        Access Now
                    </button>
                )
        }
    }

    // Placeholder action handlers
    const handleTrackShipment = (bookId) => {
        alert(`Opening shipment tracking for book ${bookId}... (Placeholder)`)
    }

    const handleReadOnline = (bookId) => {
        alert(`Opening reader for book ${bookId}... (Placeholder)`)
    }

    const handleListenOnline = (bookId) => {
        alert(`Opening audio player for book ${bookId}... (Placeholder)`)
    }

    const handleDownload = (bookId) => {
        alert(`Starting download for book ${bookId}... (Placeholder - will download when backend is ready)`)
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your library...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="container">
                <div className="library-header">
                    <h1 className="page-title">📚 My Digital Library</h1>
                    <p className="library-subtitle">{sortedBooks.length} book(s) in your library</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {books.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <h2>Your Library is Empty</h2>
                        <p>Purchase digital or audio books to access them here!</p>
                    </div>
                ) : (
                    <>
                        {/* Filter and Sort Controls */}
                        <div className="library-controls">
                            <div className="control-group">
                                <label htmlFor="format-filter" className="control-label">
                                    Format:
                                </label>
                                <select
                                    id="format-filter"
                                    value={filterFormat}
                                    onChange={(e) => setFilterFormat(e.target.value)}
                                    className="select-input"
                                >
                                    <option>All</option>
                                    <option>Physical</option>
                                    <option>Digital</option>
                                    <option>Audio</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label htmlFor="sort-by" className="control-label">
                                    Sort by:
                                </label>
                                <select
                                    id="sort-by"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="select-input"
                                >
                                    <option>Recent</option>
                                    <option>Title</option>
                                    <option>Author</option>
                                </select>
                            </div>
                        </div>

                        {/* Books Grid */}
                        {sortedBooks.length === 0 ? (
                            <div className="empty-state empty-state-filtered">
                                <p>No books found with the selected filters.</p>
                            </div>
                        ) : (
                            <div className="library-grid">
                                {sortedBooks.map((book) => (
                                    <div key={book.id} className="library-card">
                                        <div className="library-card-header">
                                            <div className="format-icon">{getFormatIcon(book.format)}</div>
                                            <div className="format-badge">{book.format}</div>
                                        </div>

                                        <div className="library-card-body">
                                            <h3 className="book-title">{book.book_title}</h3>
                                            <p className="book-author">by {book.book_author}</p>

                                            <div className="book-info">
                                                <div className="info-item">
                                                    <span className="info-label">Purchased:</span>
                                                    <span className="info-value">
                                                        {formatDate(book.purchase_date)}
                                                    </span>
                                                </div>
                                                <div className="info-item">
                                                    <span className="info-label">Accessed:</span>
                                                    <span className="info-value">
                                                        {formatDate(book.accessed_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="library-card-footer">{renderActions(book)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
