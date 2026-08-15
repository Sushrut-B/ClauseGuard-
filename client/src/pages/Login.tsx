import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { login, googleLogin as apiGoogleLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { ShieldAlert, BookOpen, Edit3, Mail, Instagram, Facebook, Linkedin } from 'lucide-react'
import s from './Auth.module.css'
import GoogleAccountModal from '../components/auth/GoogleAccountModal'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((x) => x.setAuth)
  
  // Login form state
  const [form, setForm] = useState({ email: 'bankalgisushrut@gmail.com', password: 'sushrut123' })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    setIsModalOpen(false)
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
      <GoogleAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAccount={() => handleGoogleSuccess({ credential: 'mock_google_token_123' })}
      />

      {/* Header Container */}
      <div className={s.headerContainer}>
        <span className={s.tag}>get started</span>
        <h1 className={s.title}>Let's build something secure.</h1>
        <p className={s.subtitle}>
          Whether you're looking for contract audits, compliance handbook playbooks, or real-time AI redlines, we're here to help you mitigate B2B risk.
        </p>
      </div>

      {/* Split layout card */}
      <div className={s.card}>
        {/* Left column: Info panel */}
        <div className={s.infoPanel}>
          <div>
            <h3 className={s.infoTitle}>Product Features</h3>
            <div className={s.infoList}>
              {/* Item 1: AI Risk Auditing */}
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <ShieldAlert size={18} />
                </div>
                <div className={s.infoContent}>
                  <span className={s.infoLabel}>AI Risk Auditing</span>
                  <span className={s.infoVal}>Uncover Liabilities</span>
                  <span className={s.infoSubVal}>Scan agreements and isolate legal risk scores instantly.</span>
                </div>
              </div>

              {/* Item 2: Playbook Compliance */}
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <BookOpen size={18} />
                </div>
                <div className={s.infoContent}>
                  <span className={s.infoLabel}>Playbook Compliance</span>
                  <span className={s.infoVal}>Enforce Guidelines</span>
                  <span className={s.infoSubVal}>Apply internal playbook policies to verify contract terms.</span>
                </div>
              </div>

              {/* Item 3: Smart Redlining */}
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <Edit3 size={18} />
                </div>
                <div className={s.infoContent}>
                  <span className={s.infoLabel}>Smart Redlining</span>
                  <span className={s.infoVal}>Automated Drafting</span>
                  <span className={s.infoSubVal}>Detect contradictions and resolve drafts in real time.</span>
                </div>
              </div>

              {/* Item 4: Support */}
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <Mail size={18} />
                </div>
                <div className={s.infoContent}>
                  <span className={s.infoLabel}>Email Support</span>
                  <span className={s.infoVal}>contact@clauseguard.ai</span>
                  <span className={s.infoSubVal}>24/7 dedicated legal operations support.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social connections */}
          <div className={s.infoFooter}>
            <div className={s.followTitle}>Follow our journey</div>
            <div className={s.socialRow}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={s.socialBtn}>
                <Instagram size={16} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={s.socialBtn}>
                <Facebook size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={s.socialBtn}>
                <Linkedin size={16} />
              </a>
              <a href="mailto:contact@clauseguard.ai" className={s.socialBtn}>
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Form panel */}
        <div className={s.formPanel}>
          <h3 className={s.formTitle}>Sign In to Portal</h3>
          <p className={s.formSubtitle}>We usually respond within 24 hours.</p>

          {/* Form Tabs Component */}
          <div className={s.formTabs}>
            <button type="button" className={`${s.tabBtn} ${s.tabBtnActive}`}>
              Walkthrough Login
            </button>
            <button type="button" className={s.tabBtn} onClick={() => navigate('/register')}>
              Walkthrough Signup
            </button>
          </div>

          {error && <div className={s.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Email Address *</label>
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
              <label className={s.label}>Password *</label>
              <div className={s.passwordWrapper}>
                <input
                  className={`${s.input} ${s.passwordInput}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className={s.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className={s.rowField}>
              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  className={s.checkboxInput}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/login" className={s.forgotLink}>Forgot Password?</Link>
            </div>

            <button 
              className={s.btnPrimary} 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Book Free Consultation'}
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
                onClick={() => setIsModalOpen(true)}
                disabled={loading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className={s.googleIcon} />
                Continue with Google
              </button>
            )}
          </div>

          <p className={s.foot}>
            Don't have an account?{' '}
            <Link to="/register" className={s.link}>Request Access</Link>
          </p>

          <div className={s.authFooter}>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  )
}