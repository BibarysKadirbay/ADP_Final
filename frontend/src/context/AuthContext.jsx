import React, { createContext, useState, useEffect } from 'react'
import { authAPI } from '../api.jsx'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }
        fetchProfile()
    }, [token])

    const fetchProfile = async () => {
        try {
            const response = await authAPI.getProfile()
            setUser(response.data)
        } catch (error) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password)
            const { token: newToken, ...userData } = response.data
            localStorage.setItem('token', newToken)
            setToken(newToken)
            setUser(userData)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' }
        }
    }

    const register = async (username, email, password) => {
        try {
            await authAPI.register(username, email, password)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    const isAdmin = user?.role === 'Admin'
    const isModerator = user?.role === 'Moderator' || isAdmin
    const isPremium = !!user?.is_premium

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isModerator, isPremium }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = React.useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
