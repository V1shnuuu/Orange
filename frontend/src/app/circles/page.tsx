'use client';

import { useCircleContracts } from '@/hooks/useCircleContracts';
import CircleCard from '@/components/CircleCard';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

export default function CirclesPage() {
  const { circles } = useCircleContracts();

  return (
    <div className="container py-16">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="hero-title mb-2">Explore Circles</h1>
          <p className="text-secondary">Join an active savings circle and start building reputation.</p>
        </div>
        <Link href="/circles/new" className="btn btn-primary">
          Create Circle
        </Link>
      </div>

      {circles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map(circle => (
            <CircleCard
              key={circle.id}
              id={circle.id}
              name={circle.name}
              contributionAmount={circle.contributionAmount}
              maxMembers={circle.maxMembers}
              currentMembers={circle.currentMembers}
              cycleDurationDays={circle.cycleDurationDays}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Active Circles"
          description="There are currently no active savings circles to join. Be the first to start one!"
          icon="⭕"
          action={
            <Link href="/circles/new" className="btn-primary">
              Create a Circle
            </Link>
          }
        />
      )}
    </div>
  );
}
