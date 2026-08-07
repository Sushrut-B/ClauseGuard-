import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.css'
import Sidebar from './Sidebar'
import LawBot from '../lawbot/LawBot'
import CommandPalette from '../ui/CommandPalette'
import ToastContainer from '../ui/ToastContainer'
import QuickDock from '../ui/QuickDock'

export default function Layout() {
  const location = useLocation()
  const [isCmdOpen, setIsCmdOpen] = useState(false)
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
          <div className={styles.cmdBadge} onClick={() => setIsCmdOpen(true)}>
            Press <strong>⌘K</strong> for Quick Menu
          </div>
        </div>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
      <QuickDock onOpenCmdPalette={() => setIsCmdOpen(true)} />
      <ToastContainer />
      <LawBot />
    </div>
  )
}