'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useWallet } from '@/components/WalletProvider';
import { useDistributionEvents } from '@/hooks/useDistributionEvents';
import { formatTimestamp } from '@/lib/stellar';

// Animated SVG diagram: one payment → many recipients
function SplitDiagram() {
  return (
    <svg width="320" height="200" viewBox="0 0 320 200" fill="none" className="animate-float">
      {/* Sender node */}
      <motion.circle
        cx="40" cy="100" r="20"
        fill="#00e5ff" fillOpacity="0.15"
        stroke="#00e5ff" strokeWidth="1.5"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="40" y="104" textAnchor="middle" fill="#ffffff" fontSize="12" className="font-mono">$</text>

      {/* Main flow line */}
      <motion.line
        x1="62" y1="100" x2="140" y2="100"
        stroke="#00e5ff" strokeWidth="1.5"
        strokeDasharray="6 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Split node */}
      <motion.rect
        x="142" y="82" width="36" height="36" rx="8"
        fill="#00e5ff" fillOpacity="0.2"
        stroke="#00e5ff" strokeWidth="1.5"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <text x="160" y="105" textAnchor="middle" fill="#00e5ff" fontSize="11" className="font-semibold">Split</text>

      {/* Output lines to recipients */}
      {[60, 100, 140].map((y, i) => (
        <g key={i}>
          <motion.line
            x1="180" y1="100" x2="240" y2={y}
            stroke="#00e5ff" strokeWidth="1"
            strokeOpacity="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 * i, repeat: Infinity }}
          />
          <motion.circle
            cx="260" cy={y} r="14"
            fill="#0a0a0a" stroke="rgba(255,255,255,0.15)" strokeWidth="1"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, delay: 0.3 * i, repeat: Infinity }}
          />
          <text x="260" y={y + 3} textAnchor="middle" fill="#b3b3b3" fontSize="9" className="font-mono">
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card"
    >
      <span style={{ fontSize: '32px', marginBottom: '16px', display: 'block' }}>{icon}</span>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.6' }}>{description}</p>
    </motion.div>
  );
}

// Live feed widget
function LiveFeed() {
  const { events } = useDistributionEvents();
  const recentEvents = events.slice(0, 5);

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="pulse-indicator" />
        <h3 className="font-medium text-secondary" style={{ fontSize: '14px' }}>Live Distributions</h3>
      </div>
      <div>
        {recentEvents.length > 0 ? recentEvents.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="live-feed-item"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-accent" style={{ fontSize: '12px' }}>{event.splitId}</span>
              <span className="text-secondary" style={{ fontSize: '12px' }}>
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
            <span className="font-mono font-medium text-primary">
              ${event.totalAmount}
            </span>
          </motion.div>
        )) : (
          <div className="text-secondary text-center" style={{ padding: '24px 0', fontSize: '14px' }}>
            No recent distributions. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { connect, isConnected } = useWallet();

  return (
    <div>
      {/* Hero */}
      <section className="container py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="hero-title mb-4">
              One payment.<br />
              <span className="text-accent">Infinite splits.</span><br />
              On-chain.
            </h1>
            <p className="hero-subtitle mb-8">
              CirclePact lets you create programmable revenue splits that automatically
              distribute USDC to multiple recipients on the Stellar network — atomically,
              transparently, in real time.
            </p>
            <div className="flex gap-4">
              {isConnected ? (
                <>
                  <Link href="/circles/new" className="btn btn-primary">
                    Create a Circle
                  </Link>
                  <Link href="/circles" className="btn btn-secondary">
                    Explore
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={connect} className="btn btn-primary">
                    Connect Wallet
                  </button>
                  <Link href="/circles" className="btn btn-secondary">
                    Explore
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center" style={{ padding: '40px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center' }}>
              <SplitDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="container py-16">
        <h2 className="hero-title mb-8" style={{ fontSize: '2rem' }}>Built for</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <UseCaseCard
            icon="🤝"
            title="Savings Circles"
            description="Create trustless rotating savings groups (ROSCAs) with your community, powered by smart contracts."
          />
          <UseCaseCard
            icon="🏆"
            title="On-Chain Reputation"
            description="Build verifiable credit history based on your contribution consistency and reliability."
          />
          <UseCaseCard
            icon="⚡"
            title="Instant Distributions"
            description="Automatic and transparent payouts when it's a member's turn to receive the pot."
          />
        </div>
      </section>

      {/* Live feed */}
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="hero-title mb-4" style={{ fontSize: '2rem' }}>Real-time transparency</h2>
            <p className="hero-subtitle mb-8">
              Every contribution and payout happens on-chain. Watch the protocol
              activity live as communities build wealth together.
            </p>
            <div className="flex flex-col gap-4 text-secondary">
              <div className="flex items-center gap-3">
                <span className="pulse-indicator" style={{ animation: 'none' }} />
                Smart contract enforcement
              </div>
              <div className="flex items-center gap-3">
                <span className="pulse-indicator" style={{ animation: 'none' }} />
                USDC native integration
              </div>
              <div className="flex items-center gap-3">
                <span className="pulse-indicator" style={{ animation: 'none' }} />
                No middlemen or platform fees
              </div>
            </div>
          </div>
          <LiveFeed />
        </div>
      </section>
    </div>
  );
}
