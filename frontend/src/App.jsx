import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Library from './pages/Library'
import AdminDashboard from './pages/AdminDashboard'
import Wishlist from './pages/Wishlist'

import './styles.css'

function AppRoutes() {
    const { loading } = useAuth()
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <div className="spinner" />
            </div>
        )
    }
    return (
        <>
            <Header />
            <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/books" element={<Books />} />
                        <Route path="/books/:id" element={<BookDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/wishlist" element={<Wishlist />} />

                        <Route
                            path="/orders"
                            element={
                                <ProtectedRoute>
                                    <Orders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/library"
                            element={
                                <ProtectedRoute>
                                    <Library />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute moderatorOrAdmin>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <footer>
                <p>&copy; 2024 Bookstore. All rights reserved.</p>
            </footer>
        </>
    )
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <WishlistProvider>
                        <AppRoutes />
                    </WishlistProvider>
                </CartProvider>
            </AuthProvider>
        </Router>
    )
}
