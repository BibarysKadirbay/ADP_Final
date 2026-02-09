import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
    const navigate = useNavigate()
    const { user, logout, isAdmin } = useAuth()
    const { getTotalItems } = useCart()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <header>
            <nav className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" className="logo">
                    Bookstore
                </Link>

                <ul className="nav-links">
                    <li>
                        <Link to="/books">Catalog</Link>
                    </li>
                    {user && (
                        <>
                            <li><Link to="/library">Library</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                            <li><Link to="/orders">Orders</Link></li>
                            {isAdmin && (
                                <li>
                                    <Link to="/admin"> Admin</Link>
                                </li>
                            )}
                        </>
                    )}
                </ul>

                <div className="user-menu">
                    {user ? (
                        <>
                            <div style={{ color: 'white', fontSize: '0.9rem' }}>
                                {user.username}
                                {isAdmin && <span style={{ marginLeft: '0.5rem', color: '#f39c12' }}>Admin</span>}
                                {user.role === 'Moderator' && !isAdmin && <span style={{ marginLeft: '0.5rem', color: '#9b59b6' }}>Moderator</span>}
                                {user.is_premium && <span style={{ marginLeft: '0.5rem', color: '#2ecc71' }}>Premium</span>}
                            </div>
                            <Link to="/cart" style={{ position: 'relative', color: 'white', textDecoration: 'none' }}>
                                Cart
                                {getTotalItems() > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {getTotalItems()}
                                    </span>
                                )}
                            </Link>
                            <button className="btn btn-secondary btn-small" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-primary btn-small">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-success btn-small">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    )
}
