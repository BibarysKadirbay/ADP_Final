import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
    const navigate = useNavigate()
    const { user, logout, isAdmin, isModerator } = useAuth()
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
                            {(isAdmin || isModerator) && (
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
                            <div>
                                <Link to="/profile" style={{ color: 'white', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {user.username}
                                    {isAdmin && (
                                        <span style={{
                                            display: 'inline-block',
                                            backgroundColor: '#e74c3c',
                                            color: 'white',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            Admin
                                        </span>
                                    )}
                                    {user.role === 'Moderator' && !isAdmin && (
                                        <span style={{
                                            display: 'inline-block',
                                            backgroundColor: '#9b59b6',
                                            color: 'white',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            Moderator
                                        </span>
                                    )}
                                    {user.is_premium && (
                                        <span style={{
                                            display: 'inline-block',
                                            backgroundColor: '#f39c12',
                                            color: 'white',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            ⭐ Premium
                                        </span>
                                    )}
                                </Link>
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
