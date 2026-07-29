'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Users, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import { useDistributionEvents } from '@/hooks/useDistributionEvents';
import { formatTimestamp } from '@/lib/stellar';
import Button from '@/components/Button';

/** Organic flowing line-art that sits behind the hero headline. */
/** Builds one flowing curve. `phase` shifts the control points to morph it. */
function wavePath(i: number, phase: number) {
  const y = 180 + i * 70;
  return [
    `M-100 ${y}`,
    `C ${220 + i * 40} ${40 + i * 30 + phase}`,
    `${520 - i * 30} ${420 + i * 40 - phase}`,
    `${840 + i * 25} ${200 + i * 55 + phase * 0.6}`,
    `S ${1180 + i * 20} ${120 + i * 40 - phase * 0.8}`,
    `1400 ${300 + i * 30}`,
  ].join(' ');
}

const LINES = [0, 1, 2, 3, 4];

function HeroLineArt() {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      viewBox="0 0 1200 700"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* Travelling highlight that rides along each curve */}
        <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-iris-mint)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-iris-cyan)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-iris-lavender)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {LINES.map((i) => (
        <g key={i}>
          {/* Base curve — continuously morphs between three shapes */}
          <motion.path
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              reduceMotion
                ? { pathLength: 1, opacity: 1, d: wavePath(i, 0) }
                : {
                    pathLength: 1,
                    opacity: 1,
                    d: [wavePath(i, 0), wavePath(i, 46), wavePath(i, -34), wavePath(i, 0)],
                  }
            }
            transition={{
              pathLength: { duration: 2.2, delay: i * 0.15, ease: 'easeOut' },
              opacity: { duration: 1.2, delay: i * 0.15 },
              d: reduceMotion
                ? { duration: 0 }
                : {
                    duration: 16 + i * 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                  },
            }}
          />

          {/* Light streak drifting along the same curve */}
          {!reduceMotion && (
            <motion.path
              stroke="url(#streak)"
              strokeWidth="1.5"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="0.12 0.88"
              initial={{ strokeDashoffset: 1, opacity: 0 }}
              animate={{
                strokeDashoffset: [1, 0],
                opacity: [0, 1, 1, 0],
                d: [wavePath(i, 0), wavePath(i, 46), wavePath(i, -34), wavePath(i, 0)],
              }}
              transition={{
                strokeDashoffset: {
                  duration: 7 + i * 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 1.6,
                },
                opacity: {
                  duration: 7 + i * 1.5,
                  repeat: Infinity,
                  times: [0, 0.15, 0.85, 1],
                  delay: i * 1.6,
                },
                d: {
                  duration: 16 + i * 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                },
              }}
            />
          )}
        </g>
      ))}

      <motion.ellipse
        cx="1010"
        cy="215"
        rx="26"
        ry="38"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1], rotate: [0, 8, 0] }
        }
        style={{ transformOrigin: '1010px 215px' }}
        transition={
          reduceMotion
            ? { duration: 1, delay: 0.8 }
            : { duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
        }
      />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card glass-card-hoverable p-7"
    >
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 border border-border">
        <Icon size={19} className="text-iris-mint" />
      </div>
      <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
    </motion.div>
  );
}

function LiveFeed() {
  const { events } = useDistributionEvents();
  const recentEvents = events.slice(0, 5);

  return (
    <div className="glass-card p-7">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="pulse-indicator" />
        <h3 className="text-[13px] font-medium uppercase tracking-wider text-text-secondary">
          Live distributions
        </h3>
      </div>
      {recentEvents.length > 0 ? (
        <div>
          {recentEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="live-feed-item"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-iris-cyan">{event.splitId}</span>
                <span className="text-xs text-text-muted">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              <span className="font-mono text-sm font-medium text-white">
                ${event.totalAmount}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text-muted">
          No recent distributions yet.
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { connect, isConnected } = useWallet();

  return (
    <div className="overflow-hidden">
      {/* ---------- HERO ---------- */}
      <section className="relative isolate">
        <div
          className="iris-bloom"
          style={{ width: 620, height: 620, top: -220, left: '18%' }}
          aria-hidden="true"
        />
        <HeroLineArt />

        <div className="container relative z-10 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="display-xl relative"
              >
                {/* Ghost layer, offset behind the gradient type */}
                <span
                  className="text-outline absolute -left-1 -top-1 hidden select-none md:block"
                  aria-hidden="true"
                >
                  Never save
                  <br />
                  alone
                </span>
                <span className="text-iris relative">
                  Never save
                  <br />
                  alone
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="hero-subtitle mt-7"
              >
                CirclePact turns informal savings circles into on-chain protocol.
                Pool funds, automate payouts, and build portable reputation — with
                smart contracts instead of trust.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                {isConnected ? (
                  <Link href="/circles/new">
                    <Button size="lg">
                      Create a circle
                      <ArrowRight size={17} />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" onClick={connect}>
                    Get started
                    <ArrowRight size={17} />
                  </Button>
                )}
                <Link href="/circles">
                  <Button variant="secondary" size="lg">
                    Explore circles
                  </Button>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="iris-card grain overflow-hidden p-px">
                <div className="rounded-[calc(var(--radius-xl)-1px)] bg-bg-card p-7">
                  <LiveFeed />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="container pb-24">
        <div className="iris-card grain relative overflow-hidden">
          <div className="bg-iris-soft grid gap-8 rounded-[calc(var(--radius-xl)-1px)] px-8 py-12 text-center sm:grid-cols-3">
            {[
              { value: '3', label: 'Soroban contracts live on testnet' },
              { value: '100%', label: 'On-chain, non-custodial by design' },
              { value: '0', label: 'Platform fees taken from a circle' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
                  {stat.value}
                </div>
                <p className="mx-auto mt-2 max-w-[190px] text-sm leading-snug text-black/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="container pb-28">
        <div className="mb-12 max-w-2xl">
          <span className="eyebrow mb-4">
            <span className="pulse-indicator" />
            Built for communities
          </span>
          <h2 className="display-lg text-iris">Savings circles, enforced by code</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={Users}
            title="Rotating savings"
            description="Create trustless ROSCA groups with configurable contribution amounts, cycle length, and member caps."
            delay={0}
          />
          <FeatureCard
            icon={ShieldCheck}
            title="On-chain reputation"
            description="Build verifiable credit history from your contribution consistency — portable across every circle you join."
            delay={0.08}
          />
          <FeatureCard
            icon={Zap}
            title="Automated payouts"
            description="Funds sit in a contract vault, not an organiser's wallet. Payouts fire automatically when a member's turn arrives."
            delay={0.16}
          />
        </div>
      </section>

      {/* ---------- CLOSING CTA ---------- */}
      <section className="container pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-bg-card px-8 py-16 text-center md:py-20">
          <div
            className="iris-bloom iris-bloom-centered"
            style={{ width: 460, height: 460, bottom: -280, left: '50%' }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="display-md mx-auto max-w-2xl text-white">
              Start a circle with people you trust
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
              Connect a Stellar wallet and deploy your first savings circle on testnet
              in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isConnected ? (
                <Link href="/circles/new">
                  <Button size="lg">
                    Create a circle
                    <ArrowRight size={17} />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={connect}>
                  Connect wallet
                  <ArrowRight size={17} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
