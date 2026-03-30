'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import NotificationBell from '@/components/ui/NotificationBell';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Zap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname          = usePathname();
  const router            = useRouter();
  const [open, setOpen]           = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.kp-nav-dropdown-root')) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const dashboardPath =
    user?.role === 'admin' ? '/dashboard/admin' :
    user?.role === 'host'  ? '/dashboard/host'  :
    '/dashboard/player';

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className={`kp-nav ${scrolled ? 'kp-nav-scrolled' : 'kp-nav-top'}`}>
      <div className="kp-wrap">
        <div className="kp-nav-inner">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link href="/" className="kp-nav-logo">
            <div className="kp-nav-logo-icon">
              <Zap size={18} />
            </div>
            <span className="kp-nav-logo-text">
              Kill<span className="kp-nav-logo-accent"> Pro</span>
            </span>
          </Link>

          {/* ── Desktop nav links ──────────────────────────────────────── */}
          <div className="kp-nav-links">
            <Link
              href="/tournaments"
              className={`kp-nav-link ${isActive('/tournaments') ? 'kp-nav-link-active' : ''}`}
            >
              Tournaments
            </Link>

            {user && (
              <Link
                href={dashboardPath}
                className={`kp-nav-link ${isActive('/dashboard') ? 'kp-nav-link-active' : ''}`}
              >
                Dashboard
              </Link>
            )}

            <Link href="/tournaments?status=live" className="kp-nav-link-live">
              <span className="live-dot" />
              Live
            </Link>
          </div>

          {/* ── Desktop right ──────────────────────────────────────────── */}
          <div className="kp-nav-right">
            {user ? (
              <>
                <NotificationBell />

                {/* User dropdown */}
                <div className="kp-nav-dropdown-root">
                  <button
                    className="kp-nav-user-btn"
                    onClick={() => setDropdownOpen(v => !v)}
                    aria-expanded={dropdownOpen}
                  >
                    <div className="kp-nav-avatar">
                      <User size={14} />
                    </div>
                    <span className="kp-nav-username">{user.username}</span>
                    <ChevronDown
                      size={14}
                      className={`kp-nav-chevron ${dropdownOpen ? 'kp-nav-chevron-open' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="kp-nav-dropdown animate-in">
                      {/* User info */}
                      <div className="kp-nav-dd-info">
                        <div className="kp-nav-dd-email">{user.email}</div>
                        <span className={`kp-nav-dd-role kp-role-${user.role}`}>
                          {user.role}
                        </span>
                      </div>

                      <div className="kp-nav-dd-divider" />

                      <Link
                        href={dashboardPath}
                        className="kp-nav-dd-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard size={14} />
                        Dashboard
                      </Link>

                      <Link
                        href="/profile"
                        className="kp-nav-dd-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User size={14} />
                        Profile
                      </Link>

                      <div className="kp-nav-dd-divider" />

                      <button className="kp-nav-dd-logout" onClick={handleLogout}>
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="kp-nav-auth">
                <Link href="/auth/login" className="kp-nav-signin">Sign In</Link>
                <Link href="/auth/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile toggle ──────────────────────────────────────────── */}
          <button
            className="kp-nav-mobile-toggle"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </div>

      {/* ── Mobile panel ──────────────────────────────────────────────── */}
      {open && (
        <div className="kp-nav-mobile animate-in">
          <Link href="/tournaments" className="kp-nav-mobile-link" onClick={() => setOpen(false)}>
            Tournaments
          </Link>
          <Link href="/tournaments?status=live" className="kp-nav-mobile-live" onClick={() => setOpen(false)}>
            <span className="live-dot" /> Live Now
          </Link>

          {user ? (
            <>
              <Link href={dashboardPath} className="kp-nav-mobile-link" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <div className="kp-nav-mobile-divider" />
              <div className="kp-nav-mobile-user">
                <div className="kp-nav-avatar kp-nav-avatar-lg">
                  <User size={16} />
                </div>
                <div>
                  <div className="kp-nav-username" style={{ fontSize: 14 }}>{user.username}</div>
                  <div className="kp-nav-dd-email">{user.email}</div>
                </div>
              </div>
              <button className="kp-nav-dd-logout" style={{ width: '100%', marginTop: 4 }} onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <div className="kp-nav-mobile-auth">
              <Link href="/auth/login" className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary" style={{ justifyContent: 'center', padding: '12px 28px' }} onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}