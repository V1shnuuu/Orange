'use client';

import { motion } from 'motion/react';
import React from 'react';

// Reusable Statistics Card Component
function StatCard({ title, value, change, isPositive }: { title: string; value: string; change: string; isPositive: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-bg-card border border-border rounded-xl p-6 transition-all"
    >
      <h3 className="text-sm text-text-secondary mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold font-mono text-text-primary">{value}</span>
        <span className={`text-sm font-medium ${isPositive ? 'text-accent' : 'text-error'}`}>
          {isPositive ? '+' : ''}{change}
        </span>
      </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Protocol Analytics</h1>
        <p className="text-text-secondary">Global statistics and performance metrics for CirclePact.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Value Locked" value="$1.24M" change="12.5%" isPositive={true} />
        <StatCard title="Active Circles" value="1,432" change="5.2%" isPositive={true} />
        <StatCard title="Completed Cycles" value="8,904" change="18.1%" isPositive={true} />
        <StatCard title="Active Members" value="12.5K" change="2.4%" isPositive={true} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Placeholder for beautiful chart */}
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-xl p-6 min-h-[400px] flex flex-col items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1" className="mb-4 opacity-50">
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-text-secondary">Interactive TVL Chart (Coming Soon)</p>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold text-text-primary mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="flex-1">
                  <p className="text-sm text-text-primary font-medium">New Circle Created</p>
                  <p className="text-xs text-text-muted">Alpha Squad {i}</p>
                </div>
                <span className="text-xs font-mono text-text-secondary">{i * 2}m ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
