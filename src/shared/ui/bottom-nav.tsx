import { Link, useLocation } from 'react-router-dom'
import iconNavHistory from '../../assets/icons/icon-nav-history.svg'
import iconNavHome from '../../assets/icons/icon-nav-home.svg'
import iconNavProfile from '../../assets/icons/icon-nav-profile.svg'
import iconNavRoutines from '../../assets/icons/icon-nav-routines.svg'
import iconNavStart from '../../assets/icons/icon-nav-start.svg'
import { cx } from '../lib/cx'

// Fixed bottom navigation repeated across (at least) Home and Lista de
// rutinas in the Figma design (`01-home.md`, `02-lista-rutinas.md`):
// Home / Rutinas / [floating "Iniciar" button] / Historial / Perfil.
// Extracted as one shared component instead of duplicating it per page.
//
// "Perfil" now links to the real `/profile` route (PR11) — same active/
// inactive treatment as the other tabs.
export function BottomNav() {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
        <NavItem to="/" icon={iconNavHome} label="Home" active={isActive('/')} />
        <NavItem to="/routines" icon={iconNavRoutines} label="Rutinas" active={isActive('/routines')} />

        <Link
          to="/workout/start"
          aria-label="Iniciar workout"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-background shadow-[0_0_16px_rgba(37,99,235,0.5)]"
        >
          <img src={iconNavStart} alt="" className="h-6 w-6" />
        </Link>

        <NavItem to="/history" icon={iconNavHistory} label="Historial" active={isActive('/history')} />
        <NavItem to="/profile" icon={iconNavProfile} label="Perfil" active={isActive('/profile')} />
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label, active }: { to: string; icon: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cx(
        'flex flex-1 flex-col items-center gap-0.5 py-1',
        active ? 'text-data' : 'text-muted hover:text-foreground',
      )}
    >
      <img src={icon} alt="" className="h-5 w-5" />
      <span className="font-mono text-[10px] uppercase tracking-wide">{label}</span>
    </Link>
  )
}
