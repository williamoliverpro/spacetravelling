import styles from './header.module.scss'
import Link from 'next/link'

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <nav>
          <Link href="/">
            <a>
              <img src="/logo.svg" alt="logo"/>
            </a>
          </Link>
        </nav>
      </div>
    </header>
  )
}
