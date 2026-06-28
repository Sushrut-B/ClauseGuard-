import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import s from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((st) => st.register)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>ClauseGuard</div>
        <div className={s.tagline}>Start analysing contracts in seconds</div>

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>Full name</label>
            <input
              className={s.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              autoFocus
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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
              minLength={6}
              required
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className={s.footer}>
          Already have an account?{' '}
          <Link to="/login" className={s.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}