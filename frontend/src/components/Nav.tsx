'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import WalletButton from './WalletButton';
import NetworkBadge from './NetworkBadge';
import FeedbackModal from './FeedbackModal';

const NAV_LINKS = [
  { href: '/circles', label: 'Circles' },
  { href: '/splits', label: 'Splits' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/explore', label: 'Explore' },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="nav-header">
      <div className="nav-container">
        {/* Logo */}
        <Link href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
              <circle cx="8" cy="8" r="3" fill="#00e5ff" />
            </svg>
          </div>
          <span className="nav-logo-text">
            Circle<span className="text-accent">Pact</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${
                pathname === link.href || pathname?.startsWith(link.href + '/')
                  ? 'active'
                  : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet + Mobile toggle */}
        <div className="nav-actions">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span className="hidden md:inline">Feedback</span>
          </button>
          <div style={{ display: 'none' }} className="md:block"><NetworkBadge /></div>
          <WalletButton />
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }} className="md:hidden animate-fade-in-up">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-link ${
                  pathname === link.href ? 'active' : ''
                }`}
                style={{ padding: '8px 0', fontSize: '15px' }}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setFeedbackOpen(true);
                setMobileMenuOpen(false);
              }}
              style={{ padding: '8px 0', fontSize: '15px', color: 'var(--text-secondary)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              Feedback
            </button>
          </div>
        </div>
      )}
      
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
