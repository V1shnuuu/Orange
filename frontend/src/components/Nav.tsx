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
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#00C9B1" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
              <circle cx="8" cy="8" r="3" fill="#00C9B1" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-text-primary tracking-tight">
            Circle<span className="text-accent">Pact</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href || pathname?.startsWith(link.href + '/')
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wallet + Mobile toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:text-text-primary hover:border-text-secondary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Feedback
          </button>
          <span className="hidden md:block"><NetworkBadge /></span>
          <WalletButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {mobileMenuOpen ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              ) : (
                <>
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-primary px-4 py-3 animate-slide-up">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-sm font-medium ${
                pathname === link.href
                  ? 'text-accent'
                  : 'text-text-secondary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setFeedbackOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Feedback
          </button>
        </div>
      )}
      
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
