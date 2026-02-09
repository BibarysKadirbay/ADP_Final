import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
    const navigate = useNavigate()
    const { user, logout, isAdmin } = useAuth()
    const { getTotalItems } = useCart()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const handleLogout = () => {
        logout()
        navigate('/')
        setMobileMenuOpen(false)
    }

    const totalItems = getTotalItems()

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMobileMenuOpen(false)
            }
        }

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
            }
        }
    }, [mobileMenuOpen])

    // Close menu on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const navLinks = [
        { to: '/books', label: 'Book Type' },
        { to: '/books', label: 'Recommendations' },
        { to: '/books', label: 'Popular' },
        { to: '/books', label: 'Download App' },
    ]

    return (
        <header>
            <nav
                className="container"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                }}
            >
                {/* Logo */}
                <div className="nav-left">
                    <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📚</span>
                        <span>BookHub</span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div
                    className="nav-center"
                    style={{
                        display: 'none',
                        '@media (min-width: 768px)': { display: 'flex' },
                    }}
                >
                    <ul
                        className="nav-links"
                        style={{
                            display: 'flex',
                            gap: '2rem',
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                        }}
                    >
                        {navLinks.map((link) => (
                            <li key={link.to + link.label}>
                                <Link
                                    to={link.to}
                                    style={{
                                        color: 'var(--beige-100)',
                                        textDecoration: 'none',
                                        transition: 'opacity 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.opacity = '0.7')}
                                    onMouseLeave={(e) => (e.target.style.opacity = '1')}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Desktop Right Section */}
                <div
                    className="nav-right"
                    style={{
                        display: 'none',
                        '@media (min-width: 768px)': { display: 'flex' },
                        gap: '1rem',
                        alignItems: 'center',
                    }}
                >
                    {user ? (
                        <>
                            <div style={{ color: 'var(--beige-100)', fontSize: '0.95rem' }}>
                                {user.username}
                            </div>
                            <Link
                                to="/cart"
                                style={{
                                    position: 'relative',
                                    color: 'var(--beige-100)',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                Cart
                                {totalItems > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            backgroundColor: '#d97706',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                            <button className="cta-pill" onClick={() => navigate('/admin')}>
                                Start For Free
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-primary btn-small">
                                Login
                            </Link>
                            <Link to="/register" className="cta-pill">
                                Start For Free
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        color: 'var(--beige-100)',
                        cursor: 'pointer',
                        '@media (max-width: 767px)': { display: 'block' },
                        padding: '0.5rem',
                    }}
                    aria-label="Toggle mobile menu"
                >
                    ☰
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div
                    ref={menuRef}
                    style={{
                        display: 'block',
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--dark-bg, #1a1a1a)',
                        borderTop: '1px solid var(--beige-200, #d4c9b8)',
                        zIndex: 1000,
                        maxHeight: 'calc(100vh - 60px)',
                        overflowY: 'auto',
                    }}
                >
                    <nav
                        style={{
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}
                    >
                        {/* Mobile Navigation Links */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.to + link.label}
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    color: 'var(--beige-100)',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid var(--beige-300, #e8dcc8)',
                                    transition: 'backgroundColor 0.2s ease',
                                }}
                                onMouseEnter={(e) =>
                                    (e.target.style.backgroundColor = 'rgba(212, 201, 184, 0.1)')
                                }
                                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Mobile User Section */}
                        {user ? (
                            <>
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        color: 'var(--beige-100)',
                                        borderBottom: '1px solid var(--beige-300, #e8dcc8)',
                                        fontWeight: '500',
                                    }}
                                >
                                    👤 {user.username}
                                </div>
                                <Link
                                    to="/cart"
                                    onClick={() => setMobileMenuOpen(false)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        color: 'var(--beige-100)',
                                        textDecoration: 'none',
                                        borderBottom: '1px solid var(--beige-300, #e8dcc8)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span>🛒 Cart</span>
                                    {totalItems > 0 && (
                                        <span
                                            style={{
                                                backgroundColor: '#d97706',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {totalItems}
                                        </span>
                                    )}
                                </Link>
                                <button
                                    className="cta-pill"
                                    onClick={() => {
                                        navigate('/admin')
                                        setMobileMenuOpen(false)
                                    }}
                                    style={{ margin: '0.5rem 1rem', width: 'calc(100% - 2rem)' }}
                                >
                                    Start For Free
                                </button>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        margin: '0.5rem 1rem',
                                        width: 'calc(100% - 2rem)',
                                        borderRadius: '4px',
                                        transition: 'backgroundColor 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#dc2626')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#ef4444')}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="btn btn-primary btn-small"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        margin: '0.5rem 1rem',
                                        width: 'calc(100% - 2rem)',
                                        textAlign: 'center',
                                    }}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="cta-pill"
                                    style={{
                                        padding: '0.75rem 1rem',
                                        margin: '0.5rem 1rem',
                                        width: 'calc(100% - 2rem)',
                                        textAlign: 'center',
                                    }}
                                >
                                    Start For Free
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}
