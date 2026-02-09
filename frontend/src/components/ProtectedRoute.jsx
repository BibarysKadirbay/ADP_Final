import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="page">
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    if (adminOnly && user.role !== 'Admin') {
        return <Navigate to="/books" />
    }

    return children
}
