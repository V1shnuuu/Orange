'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useWallet } from '@/components/WalletProvider';
import { useDistributionEvents } from '@/hooks/useDistributionEvents';
import { formatTimestamp } from '@/lib/stellar';

// Animated SVG diagram: one payment → many recipients
function SplitDiagram() {
  return (
    <svg width="320" height="200" viewBox="0 0 320 200" fill="none" className="mx-auto">
      {/* Sender node */}
      <motion.circle
        cx="40" cy="100" r="20"
        fill="#00C9B1" fillOpacity="0.15"
        stroke="#00C9B1" strokeWidth="1.5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="40" y="104" textAnchor="middle" fill="#F5F5F0" fontSize="10" fontFamily="monospace">$</text>

      {/* Main flow line */}
      <motion.line
        x1="62" y1="100" x2="140" y2="100"
        stroke="#00C9B1" strokeWidth="1.5"
        strokeDasharray="6 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Split node */}
      <motion.rect
        x="142" y="82" width="36" height="36" rx="8"
        fill="#00C9B1" fillOpacity="0.2"
        stroke="#00C9B1" strokeWidth="1.5"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="160" y="105" textAnchor="middle" fill="#00C9B1" fontSize="11" fontWeight="600">Split</text>

      {/* Output lines to recipients */}
      {[60, 100, 140].map((y, i) => (
        <g key={i}>
          <motion.line
            x1="180" y1="100" x2="240" y2={y}
            stroke="#00C9B1" strokeWidth="1"
            strokeOpacity="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 * i, repeat: Infinity }}
          />
          <motion.circle
            cx="260" cy={y} r="14"
            fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="1"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, delay: 0.3 * i, repeat: Infinity }}
          />
          <text x="260" y={y + 4} textAnchor="middle" fill="#A0A0A0" fontSize="9" fontFamily="monospace">
            {['50%', '30%', '20%'][i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Use case card
function UseCaseCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: 'rgba(0, 201, 177, 0.3)' }}
      className="p-6 rounded-xl bg-bg-card border border-border transition-all"
    >
      <span className="text-2xl mb-3 block">{icon}</span>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Live feed widget
function LiveFeed() {
  const { events } = useDistributionEvents();
  const recentEvents = events.slice(0, 5);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse-teal" />
        <h3 className="text-sm font-medium text-text-secondary">Live Distributions</h3>
      </div>
      <div className="space-y-3">
        {recentEvents.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-accent truncate">{event.splitId}</span>
              <span className="text-xs text-text-muted hidden sm:inline">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
            <span className="text-sm font-mono font-medium text-text-primary whitespace-nowrap ml-3">
              ${event.totalAmount}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { connect, isConnected } = useWallet();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
                One payment.
                <br />
                <span className="text-accent">Infinite splits.</span>
                <br />
                On-chain.
              </h1>
              <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-lg">
                SplitStream lets you create programmable revenue splits that automatically
                distribute USDC to multiple recipients on the Stellar network — atomically,
                transparently, in real time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {isConnected ? (
                  <>
                    <Link href="/splits/new" className="btn-primary text-center">
                      Create a Split
                    </Link>
                    <Link href="/explore" className="btn-secondary text-center">
                      Explore Splits
                    </Link>
                  </>
                ) : (
                  <>
                    <button onClick={connect} className="btn-primary">
                      Create a Split
                    </button>
                    <Link href="/explore" className="btn-secondary text-center">
                      Explore Splits
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="p-8 rounded-2xl border border-border bg-bg-card animate-glow">
              <SplitDiagram />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-text-primary mb-8">Built for</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <UseCaseCard
            icon="🎵"
            title="Creator Royalties"
            description="Split streaming revenue, NFT royalties, or content earnings automatically among collaborators."
          />
          <UseCaseCard
            icon="👥"
            title="Team Payment Splits"
            description="Set up recurring payment distributions for your team with transparent, on-chain accounting."
          />
          <UseCaseCard
            icon="🏛️"
            title="DAO Treasury Distributions"
            description="Automate treasury disbursements to contributors, grant recipients, and operational budgets."
          />
        </div>
      </section>

      {/* Live feed */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Real-time distributions</h2>
            <p className="text-text-secondary mb-6">
              Every payment is split on-chain in a single atomic transaction. Watch distributions
              happen live across the network.
            </p>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Atomic multi-recipient transfers
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Cross-contract verification via Soroban
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Full on-chain audit trail with events
              </div>
            </div>
          </div>
          <LiveFeed />
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-bg-primary/90 backdrop-blur-xl border-t border-border p-3 z-40">
        <div className="flex gap-2">
          {isConnected ? (
            <Link href="/splits/new" className="btn-primary flex-1 text-center text-sm">
              Create a Split
            </Link>
          ) : (
            <button onClick={connect} className="btn-primary flex-1 text-sm">
              Connect Wallet
            </button>
          )}
          <Link href="/explore" className="btn-secondary flex-1 text-center text-sm">
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
