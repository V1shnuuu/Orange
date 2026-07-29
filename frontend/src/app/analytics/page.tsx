'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

function StatCard({
  title,
  value,
  change,
  isPositive,
  delay,
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card glass-card-hoverable p-6"
    >
      <h3 className="mb-3 text-[13px] font-medium text-text-secondary">{title}</h3>
      <div className="flex items-end justify-between gap-3">
        <span className="font-mono text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        <span
          className={`flex items-center gap-1 text-[13px] font-medium ${
            isPositive ? 'text-accent' : 'text-error'
          }`}
        >
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </span>
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="container py-14">
      <PageHeader
        eyebrow="Analytics"
        title="Protocol analytics"
        description="Global statistics and performance metrics for CirclePact."
      />

      {/* These figures are illustrative placeholders, not live chain data. */}
      <div
        role="note"
        className="mb-8 rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3 text-[13px] text-warning"
      >
        Sample data — these figures are placeholders for layout purposes and do not
        reflect live on-chain activity.
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total value locked" value="$1.24M" change="12.5%" isPositive delay={0} />
        <StatCard title="Active circles" value="1,432" change="5.2%" isPositive delay={0.06} />
        <StatCard title="Completed cycles" value="8,904" change="18.1%" isPositive delay={0.12} />
        <StatCard title="Active members" value="12.5K" change="2.4%" isPositive delay={0.18} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Chart placeholder */}
        <div className="glass-card flex min-h-[400px] flex-col items-center justify-center p-7 lg:col-span-2">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-surface">
            <BarChart3 size={24} className="text-text-muted" />
          </div>
          <p className="text-sm font-medium text-white">Interactive TVL chart</p>
          <p className="mt-1 text-sm text-text-muted">Coming soon</p>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-7">
          <h2 className="mb-6 text-[15px] font-semibold tracking-tight text-white">
            Recent activity
          </h2>
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 border-b border-border py-3.5 last:border-0"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">New circle created</p>
                  <p className="mt-0.5 text-xs text-text-muted">Alpha Squad {i}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-text-muted">
                  {i * 2}m ago
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
