import { Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'
import Sidebar from './Sidebar'
import LawBot from '../lawbot/LawBot'

export default function Layout() {
  const location = useLocation()
  const pathName = location.pathname.replace('/', '') || 'dashboard'

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarCrumb}>ClauseGuard</span>
          <span className={styles.topbarSep}>/</span>
          <span className={styles.topbarTitle} style={{ textTransform: 'capitalize' }}>
            {pathName}
          </span>
          <div className={styles.topbarSpacer} />
          <div className={styles.cmdBadge}>
            Press <strong>⌘K</strong> for Quick Menu
          </div>
        </div>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <LawBot />
    </div>
  )
}