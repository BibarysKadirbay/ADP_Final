import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)
        if (result.success) {
            navigate('/books')
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    return (
        <div className="page">
            <div className="container">
                <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                    <form className="card" style={{ padding: '2rem' }} onSubmit={handleSubmit}>
                        <h2 className="card-title">Login</h2>
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                            Don't have an account? <Link to="/register" style={{ color: 'var(--brown-700)', fontWeight: '600' }}>Register here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
