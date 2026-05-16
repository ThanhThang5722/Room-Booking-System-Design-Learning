export function SkeletonLine({ width = '100%', height = 12, style }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function RoomCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skel-image" />
      <div className="skel-body">
        <SkeletonLine width="40%" height={10} />
        <SkeletonLine width="70%" height={20} />
        <SkeletonLine width="90%" height={10} />
        <SkeletonLine width="60%" height={10} />
      </div>
    </div>
  );
}

export function RoomGridSkeleton({ count = 6 }) {
  return (
    <div className="room-grid">
      {Array.from({ length: count }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookingItemSkeleton() {
  return (
    <div className="booking-item">
      <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--r-md)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width="45%" height={10} />
        <SkeletonLine width="30%" height={10} />
      </div>
      <SkeletonLine width={80} height={28} />
    </div>
  );
}
