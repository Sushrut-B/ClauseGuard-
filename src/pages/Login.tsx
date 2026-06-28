import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import s from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((st) => st.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>ClauseGuard</div>
        <div className={s.tagline}>AI-powered contract risk analysis</div>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" className={s.link}>Create one</Link>
        </div>
      </div>
    </div>
  )
}