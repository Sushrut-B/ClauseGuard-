import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ShieldAlert, BookOpen, Edit3, ArrowRight } from 'lucide-react'
import s from './Landing.module.css'

export default function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const panels = [
    {
      id: 0,
      title: 'Risk Audit',
      subtitle: 'AI-POWERED ANALYSIS',
      description: 'Automatically scan and identify liabilities, indemnities, and high-risk terms within any agreement.',
      bgImage: '/risk_audit.jpg',
      icon: <ShieldAlert className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    },
    {
      id: 1,
      title: 'Playbooks',
      subtitle: 'COMPLIANCE AUDITS',
      description: 'Instantly cross-check clause compliance against your custom playbook rules and corporate guidelines.',
      bgImage: '/playbooks.jpg',
      icon: <BookOpen className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    },
    {
      id: 2,
      title: 'Redlining',
      subtitle: 'BESPOKE ALTERNATIVES',
      description: 'Draft precise clause modifications and generate legal alternative options in seconds with context-aware AI.',
      bgImage: '/redlining.jpg',
      icon: <Edit3 className={s.panelIcon} />,
      link: isAuthenticated ? '/dashboard' : '/register'
    }
  ]

  return (
    <div className={s.wrapper}>
      {/* 1. TRANSLUCENT PREMIUM HEADER */}
      <header className={s.header}>
        <div className={s.logo} onClick={() => navigate('/')}>
          <div className={s.logoMain}>
            <span className={s.logoClause}>clause</span>
            <span className={s.logoGuard}>guard</span>
          </div>
          <span className={s.logoTagline}>Risk Audit &nbsp;|&nbsp; Compliance &nbsp;|&nbsp; Redlining</span>
        </div>
        <div className={s.authActions}>
          {isAuthenticated ? (
            <button className={s.btnPrimary} onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className={s.linkSignIn}>Sign In</Link>
              <Link to="/register" className={s.btnPrimary}>Request Access</Link>
            </>
          )}
        </div>
      </header>

      {/* 2. SPLIT HORIZONTAL EXPANDING PANELS */}
      <main className={s.splitContainer}>
        {panels.map((panel, index) => {
          const isHovered = hoveredIndex === index
          return (
            <div
              key={panel.id}
              className={`${s.panel} ${isHovered ? s.panelActive : ''} ${hoveredIndex !== null && !isHovered ? s.panelInactive : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => navigate(panel.link)}
            >
              {/* Background Image Layer */}
              <div 
                className={s.panelBg}
                style={{ backgroundImage: `url(${panel.bgImage})` }}
              />
              
              {/* Overlay Layer for Vignette and Dimming */}
              <div className={s.panelOverlay} />

              {/* Panel Content */}
              <div className={s.panelContent}>
                <div className={s.iconCircle}>
                  {panel.icon}
                </div>
                
                <span className={s.panelSubtitle}>{panel.subtitle}</span>
                <h2 className={s.panelTitle}>{panel.title}</h2>
                
                <p className={s.panelDescription}>
                  {panel.description}
                </p>

                <div className={s.panelCTA}>
                  <span>Explore Feature</span>
                  <ArrowRight className={s.ctaArrow} />
                </div>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}

