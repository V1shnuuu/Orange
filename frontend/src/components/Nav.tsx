'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Menu, X } from 'lucide-react';
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

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="nav-header">
      <div className="nav-container">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
              <circle cx="8" cy="8" r="3" fill="#000" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            circlepact
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                isActive(link.href)
                  ? 'text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-full bg-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium text-text-secondary hover:text-white hover:bg-white/8 transition-colors"
          >
            <MessageCircle size={14} />
            Feedback
          </button>
          <div className="hidden md:block">
            <NetworkBadge />
          </div>
          <WalletButton />

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden max-w-[1200px] mx-auto mt-2 rounded-3xl border border-border bg-bg-surface/90 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-white bg-white/10'
                      : 'text-text-secondary hover:text-white hover:bg-white/6'
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
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/6 transition-colors text-left"
              >
                <MessageCircle size={16} />
                Feedback
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
