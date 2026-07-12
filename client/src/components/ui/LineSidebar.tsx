import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './LineSidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface LineSidebarProps {
  navItems: NavItem[];
}

export default function LineSidebar({ navItems }: LineSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.nav}>
      <div className={styles.navSection}>Navigation</div>
      <div className={styles.linkList}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className={styles.indicator}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={styles.navContent}>
                <div className={styles.navIcon}>{item.icon}</div>
                <span className={styles.navLabel}>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
