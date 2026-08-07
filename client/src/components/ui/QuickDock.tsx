import { useNavigate } from 'react-router-dom'
import s from './QuickDock.module.css'
import { showToast } from './ToastContainer'

export interface QuickDockProps {
  onOpenCmdPalette: () => void
}

export default function QuickDock({ onOpenCmdPalette }: QuickDockProps) {
  const navigate = useNavigate()

  return (
    <div className={s.dockWrapper}>
      <div className={s.dock}>
        <button className={s.dockBtn} onClick={onOpenCmdPalette} title="Command Palette (⌘K)">
          <svg className={s.dockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Quick Menu</span>
        </button>

        <div className={s.divider} />

        <button className={s.dockBtn} onClick={() => navigate('/upload')} title="Upload Contract">
          <svg className={s.dockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <span>Upload</span>
        </button>

        <div className={s.divider} />

        <button
          className={s.dockBtn}
          onClick={() => {
            showToast('AI Audit Engine active & monitoring workspace', 'info')
          }}
          title="AI Risk Audit Status"
        >
          <svg className={s.dockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.4 7.2L21.6 11.6l-7.2 2.4L12 21.2l-2.4-7.2-7.2-2.4 7.2-2.4L12 2z" />
          </svg>
          <span>AI Active</span>
        </button>
      </div>
    </div>
  )
}
