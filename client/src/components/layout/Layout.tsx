import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import styles from './Layout.module.css'
import LawBot from '../lawbot/LawBot'
import LineSidebar from '../ui/LineSidebar'

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { path: '/upload', label: 'Upload', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  )},
  { path: '/insights', label: 'Insights', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { path: '/comparison', label: 'Compare', icon: (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
  )},
  { path: '/playbook', label: 'Playbook', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
  )},
  { path: '/cross-check', label: 'Cross-Check', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M16 3h5v5M4 21h5v-5M9 8l11 11M15 8l-11 11"/></svg>
  )},
  { path: '/reminders', label: 'Reminders', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
  )},
  { path: '/billing', label: 'Billing', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
  )},
]

export default function Layout() {
  const navigate = useNavigate()
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
        <LineSidebar navItems={navItems} />
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
      <LawBot />
    </div>
  )
}