import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function Loading() {
  return (
    <div className="container py-14">
      <div className="mb-10">
        <div className="skeleton mb-3 h-8 w-1/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      <LoadingSkeleton count={3} />
    </div>
  );
}
