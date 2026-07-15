'use client';

import Link from 'next/link';
import EmptyState from '@/components/EmptyState';

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <EmptyState
        icon="🌌"
        title="Page Not Found"
        description="The page you are looking for doesn't exist or has been moved."
      />
      <div className="mt-8">
        <Link href="/" className="btn-primary">
          Return Home
        </Link>
      </div>
    </div>
  );
}
