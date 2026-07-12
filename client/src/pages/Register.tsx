import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { register, googleLogin as apiGoogleLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import s from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((x) => x.setAuth)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, accessToken, refreshToken } = await register(form.email, form.password, form.name)
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('')
    setLoading(true)
    try {
      if (credentialResponse.credential) {
        const { user, accessToken, refreshToken } = await apiGoogleLogin(credentialResponse.credential)
        setAuth(user, accessToken, refreshToken)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Google Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.brandPanel}>
        <div className={s.brandWordmark}>Clause<span>Guard</span></div>
        <p className={s.brandTagline}>
          Institutional-grade contract intelligence. 
          Automate risk analysis, enforce compliance, and protect your enterprise.
        </p>
      </div>

      <div className={s.authPanel}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h1 className={s.title}>Request Access</h1>
            <p className={s.sub}>Create a new enterprise account.</p>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Full Name</label>
              <input
                className={s.input}
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Corporate Email</label>
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
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className={s.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Processing Request…' : 'Create Account'}
            </button>
          </form>

          <div className={s.divider}>
            <span>OR</span>
          </div>

          <div className={s.googleBtnWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google authentication failed')
              }}
              theme="outline"
              size="large"
              shape="rectangular"
              width="100%"
              text="signup_with"
            />
          </div>

          <p className={s.foot}>
            Already have an account?{' '}
            <Link to="/login" className={s.link}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}