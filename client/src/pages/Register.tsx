import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { register, googleLogin as apiGoogleLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { motion } from 'framer-motion'
import s from './Auth.module.css'
import GoogleAccountModal from '../components/auth/GoogleAccountModal'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((x) => x.setAuth)
  
  // Registration form state
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setError(err.response?.data?.error ?? 'Google Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // Floating background particles configuration
  const particles = [
    { size: 120, top: '10%', left: '15%', delay: 0, duration: 12 },
    { size: 160, top: '65%', left: '70%', delay: 1, duration: 15 },
    { size: 90, top: '45%', left: '5%', delay: 3, duration: 10 }
  ]

  // core USPs
  const usps = [
    { title: 'AI-Powered Risk Audits', desc: 'Scan complex agreements and uncover liabilities instantly.' },
    { title: 'Real-Time Playbook Compliance', desc: 'Apply internal policies and auto-generate compliance redlines.' },
    { title: 'Source-Grounded Citation Highlights', desc: 'Jump to exact PDF page numbers verifying flagged clauses.' },
    { title: 'Enterprise Isolation & Safety', desc: 'Client documents are never saved or used to train public LLM models.' }
  ]

  return (
    <div className={s.page}>
      <GoogleAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAccount={() => handleGoogleSuccess({ credential: 'mock_google_token_123' })}
      />

      {/* LEFT PANEL - BRANDING / SHOWCASE */}
      <div className={s.leftPanel}>
        {/* Animated background particles */}
        {particles.map((p, idx) => (
          <motion.div
            key={idx}
            className={s.particle}
            style={{ width: p.size, height: p.size, top: p.top, left: p.left }}
            animate={{
              y: [0, -25, 0],
              x: [0, 15, 0],
              opacity: [0.15, 0.35, 0.15]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut'
            }}
          />
        ))}

        <div className={s.leftHeader}>
          <div className={s.brandIcon}>🛡️</div>
          <div className={s.brandWordmark}>Clause<span>Guard</span></div>
        </div>

        <div className={s.leftBody}>
          <motion.h1 
            className={s.heroTitle}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Institutional-grade contract intelligence.
          </motion.h1>
          <motion.p 
            className={s.heroDesc}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Empower legal operations, audit liability caps, and enforce standard guidelines in bulk. Powered by secure, grounded intelligence.
          </motion.p>

          {/* Abstract Dashboard SVG Graphic */}
          <motion.div 
            className={s.dashboardGraphic}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%' }}>
              <rect width="400" height="240" rx="8" fill="#111827" />
              
              {/* Dashboard Layout mockup */}
              <rect x="20" y="20" width="360" height="30" rx="4" fill="#1F2937" />
              <circle cx="40" cy="35" r="5" fill="#EF4444" />
              <circle cx="55" cy="35" r="5" fill="#F59E0B" />
              <circle cx="70" cy="35" r="5" fill="#10B981" />
              
              <rect x="20" y="65" width="110" height="70" rx="6" fill="#1F2937" />
              <text x="32" y="88" fill="#9CA3AF" fontSize="10" fontWeight="bold">ACTIVE CONTRACTS</text>
              <text x="32" y="118" fill="#B89047" fontSize="24" fontWeight="bold">1,248</text>

              <rect x="145" y="65" width="110" height="70" rx="6" fill="#1F2937" />
              <text x="157" y="88" fill="#9CA3AF" fontSize="10" fontWeight="bold">RISK DEVIATIONS</text>
              <text x="157" y="118" fill="#EF4444" fontSize="24" fontWeight="bold">34</text>

              <rect x="270" y="65" width="110" height="70" rx="6" fill="#1F2937" />
              <text x="282" y="88" fill="#9CA3AF" fontSize="10" fontWeight="bold">COMPLIANCE RATE</text>
              <text x="282" y="118" fill="#10B981" fontSize="24" fontWeight="bold">97.8%</text>

              {/* Chart Line Representation */}
              <rect x="20" y="150" width="360" height="70" rx="6" fill="#1F2937" />
              <path d="M30 200 Q 100 180, 160 190 T 280 165 T 370 170" stroke="#B89047" strokeWidth="2.5" fill="none" />
              <circle cx="280" cy="165" r="3" fill="#B89047" />
              <text x="280" y="155" fill="#ffffff" fontSize="8" textAnchor="middle">Compliance Threshold Passed</text>
            </svg>
          </motion.div>

          <div className={s.uspList}>
            {usps.map((usp, idx) => (
              <motion.div 
                key={idx} 
                className={s.uspItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
              >
                <div className={s.uspDot}>✓</div>
                <div className={s.uspText}>
                  <div className={s.uspLabel}>{usp.title}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className={s.leftFooter}>
          <span>✓ ISO/IEC 27018 Guidelines Mapped</span>
          <span>• SOC-2 Data Segregation compliant</span>
        </div>
      </div>

      {/* RIGHT PANEL - REGISTRATION FORM CARD */}
      <div className={s.rightPanel}>
        <motion.div 
          className={s.card}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile brand header visible only on narrow screens */}
          <div className={s.mobileBranding} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className={s.brandIcon}>🛡️</div>
            <span>Clause<span>Guard</span></span>
          </div>

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
              <div className={s.passwordWrapper}>
                <input
                  className={`${s.input} ${s.passwordInput}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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

            <motion.button 
              className={s.btnPrimary} 
              type="submit" 
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Processing Request…' : 'Create Account'}
            </motion.button>
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
                text="signup_with"
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
            Already have an account?{' '}
            <Link to="/login" className={s.link}>Sign In</Link>
          </p>

          <div className={s.authFooter}>
            <Link to="/">Terms of Service</Link>
            <Link to="/">Privacy Policy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}