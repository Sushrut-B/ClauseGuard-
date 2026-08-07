import s from './GoogleAccountModal.module.css'


interface Props {
  isOpen: boolean
  onClose: () => void
  onSelectAccount: (email: string) => void
}

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount }: Props) {
  if (!isOpen) return null

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className={s.googleLogo}
          />
          <h2 className={s.title}>Choose an account</h2>
          <p className={s.subtitle}>
            to continue to <span>ClauseGuard</span>
          </p>
        </div>

        <div className={s.accountList}>
          <button
            type="button"
            className={s.accountItem}
            onClick={() => onSelectAccount('bankalgisushrut@gmail.com')}
          >
            <div className={s.avatar}>S</div>
            <div className={s.info}>
              <span className={s.name}>Sushrut Bankalgi</span>
              <span className={s.email}>bankalgisushrut@gmail.com</span>
            </div>
            <span className={s.badge}>Signed in</span>
          </button>

          <button
            type="button"
            className={s.useAnother}
            onClick={() => onSelectAccount('bankalgisushrut@gmail.com')}
          >
            <svg className={s.plusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Use another account
          </button>
        </div>

        <div className={s.footer}>
          <span>To continue, Google will share your name & email.</span>
          <button type="button" className={s.closeBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
