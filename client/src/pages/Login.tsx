import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, googleLogin as apiGoogleLogin } from '../api/auth'
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
      setError(err.response?.data?.error ?? 'Google Login failed')
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
            <h1 className={s.title}>Welcome Back</h1>
            <p className={s.sub}>Sign in to access your secure dashboard.</p>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Email Address</label>
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
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className={s.divider}>
            <span>OR</span>
          </div>

          <div className={s.googleBtnWrapper}>
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'placeholder' ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google authentication failed')
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                width="100%"
              />
            ) : (
              <button 
                type="button" 
                className={s.mockGoogleBtn} 
                onClick={() => handleGoogleSuccess({ credential: 'mock_google_token_123' })}
                disabled={loading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className={s.googleIcon} />
                Continue with Google (Mock)
              </button>
            )}
          </div>

          <p className={s.foot}>
            Don't have an account?{' '}
            <Link to="/register" className={s.link}>Request Access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}