import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import styles from './Layout.module.css'

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { path: '/upload', label: 'Upload', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  )},
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <div className={styles.wordmark}>Clause<span>Guard</span></div>
          <div className={styles.tagline}>Contract Risk Intelligence</div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>Navigation</div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
            <div>
              <div className={styles.userName}>{user?.name ?? 'User'}</div>
              <div className={styles.userEmail}>{user?.email ?? ''}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarCrumb}>ClauseGuard</span>
          <span className={styles.topbarSep}>/</span>
          <span className={styles.topbarTitle}>
            {navItems.find(n => location.pathname.startsWith(n.path))?.label ?? 'Analysis'}
          </span>
          <div className={styles.topbarSpacer} />
          <button className={styles.btnPrimary} onClick={() => navigate('/upload')}>
            + Upload Contract
          </button>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}