import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Button from '../ui/Button'
import s from './Sidebar.module.css'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    {
      group: 'Overview',
      items: [
        {
          label: 'Dashboard',
          to: '/dashboard',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          ),
        },
        {
          label: 'Upload Contract',
          to: '/upload',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'Intelligence',
      items: [
        {
          label: 'Comparison',
          to: '/comparison',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
          ),
        },
        {
          label: 'Cross-Check',
          to: '/cross-check',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          ),
        },
        {
          label: 'Insights',
          to: '/insights',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          label: 'Reminders',
          to: '/reminders',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          ),
        },
        {
          label: 'Playbooks',
          to: '/playbook',
          icon: (
            <svg className={s.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" />
            </svg>
          ),
        },
      ],
    },
  ]

  return (
    <aside className={`${s.sidebar} ${collapsed ? s.sidebarCollapsed : ''}`}>
      <div className={s.header}>
        <div className={s.brand}>
          <div className={s.brandIcon}>C</div>
          {!collapsed && <div>Clause<span>Guard</span></div>}
        </div>
        <button className={s.toggleBtn} onClick={() => setCollapsed((v) => !v)} title="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? 'M13 17l5-5-5-5M6 17l5-5-5-5' : 'M11 17l-5-5 5-5M18 17l-5-5 5-5'} />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className={s.actionWrapper}>
          <Button size="sm" onClick={() => navigate('/upload')} style={{ width: '100%' }}>
            + Upload Contract
          </Button>
        </div>
      )}

      <div className={s.navSection}>
        {navItems.map((sec, idx) => (
          <div key={idx}>
            {!collapsed && <div className={s.sectionLabel}>{sec.group}</div>}
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className={s.footer}>
        <div className={s.userInfo}>
          <div className={s.avatar}>{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
          {!collapsed && (
            <div className={s.userDetails}>
              <span className={s.userName}>{user?.name || 'User'}</span>
              <span className={s.userRole}>{user?.role || 'Admin'}</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button className={s.logoutBtn} onClick={handleLogout} title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  )
}
