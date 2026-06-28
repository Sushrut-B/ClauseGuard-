import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import s from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((x) => x.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, accessToken, refreshToken } = await login(form.email, form.password)
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.cardHead}>
          <div className={s.wordmark}>Clause<span>Guard</span></div>
          <p className={s.sub}>Sign in to your account</p>
        </div>

        {error && <div className={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button className={s.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={s.foot}>
          Don't have an account?{' '}
          <Link to="/register" className={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}