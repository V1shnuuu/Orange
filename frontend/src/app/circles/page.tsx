'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCircleContracts } from '@/hooks/useCircleContracts';
import CircleCard from '@/components/CircleCard';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';

export default function CirclesPage() {
  const { circles } = useCircleContracts();

  return (
    <div className="container py-14">
      <PageHeader
        eyebrow="Circles"
        title="Explore savings circles"
        description="Join an active circle and start building on-chain reputation."
        actions={
          <Link href="/circles/new">
            <Button>
              <Plus size={16} />
              Create circle
            </Button>
          </Link>
        }
      />

      {circles.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {circles.map((circle) => (
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
          title="No active circles"
          description="There are no active savings circles to join right now. Be the first to start one."
          icon="○"
          action={
            <Link href="/circles/new">
              <Button>
                <Plus size={16} />
                Create a circle
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
