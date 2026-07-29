'use client';

import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col justify-center py-20">
      <EmptyState
        icon="◌"
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Link href="/">
            <Button>Return home</Button>
          </Link>
        }
      />
    </div>
  );
}
