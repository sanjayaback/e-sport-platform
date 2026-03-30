'use client'

import { Zap } from 'lucide-react'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SOCIALS: [string, string][] = [
  ['D', 'Discord'],
  ['T', 'Twitter'],
  ['Y', 'YouTube'],
]

const QUICK_LINKS = ['Tournaments', 'Leaderboard', 'Teams', 'Results']

const SUPPORT_LINKS = ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service']

const LEGAL_LINKS = ['Privacy', 'Terms', 'Cookies']

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="kp-footer">
      <div className="kp-wrap">

        {/* ── Grid ───────────────────────────────────────────────────────── */}
        <div className="kp-footer-grid">

          {/* Brand */}
          <div className="kp-footer-brand">
            <div className="kp-footer-logo">
              <div className="kp-footer-logo-icon">
                <Zap size={18} />
              </div>
              <div>
                <div className="kp-footer-logo-name">Kill Pro</div>
                <div className="kp-footer-logo-sub">Esports Tournament Platform</div>
              </div>
            </div>

            <p className="kp-footer-about">
              The premier destination for mobile esports competitions.
              Join thousands of players in thrilling tournaments and win real prizes.
            </p>

            <div className="kp-footer-socials">
              {SOCIALS.map(([letter, name]) => (
                <a
                  key={name}
                  href="#"
                  className="kp-footer-social"
                  aria-label={name}
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="kp-footer-col-title">Quick Links</div>
            <ul className="kp-footer-links">
              {QUICK_LINKS.map(label => (
                <li key={label}>
                  <a href={`/${label.toLowerCase()}`} className="kp-footer-link">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="kp-footer-col-title">Support</div>
            <ul className="kp-footer-links">
              {SUPPORT_LINKS.map(label => (
                <li key={label}>
                  <a href="#" className="kp-footer-link">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div className="kp-footer-bottom">
          <span className="kp-footer-copy">© 2025 Kill Pro. All rights reserved.</span>
          <div className="kp-footer-legal">
            {LEGAL_LINKS.map(label => (
              <a key={label} href="#" className="kp-footer-legal-link">
                {label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}