import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-1/3 bg-bg-surface animate-pulse rounded-md mb-3" />
        <div className="h-4 w-1/2 bg-bg-surface animate-pulse rounded-md" />
      </div>
      <LoadingSkeleton count={3} />
    </div>
  );
}
