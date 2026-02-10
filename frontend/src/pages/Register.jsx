import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { register } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 8 || /\s/.test(password)) {
            setError('Password must be at least 8 characters and contain no spaces')
            return
        }

        setLoading(true)
        const result = await register(username, email, password)

        if (result.success) {
            navigate('/login')
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    return (
        <div className="page">
            <div className="container">
                <form className="form" onSubmit={handleSubmit}>
                    <h2 className="card-title">Register</h2>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

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
                            minLength="8"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <small style={{ color: '#666' }}>Minimum 8 characters, no spaces</small>
                    </div>

                    <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>

                    <p style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    )
}
