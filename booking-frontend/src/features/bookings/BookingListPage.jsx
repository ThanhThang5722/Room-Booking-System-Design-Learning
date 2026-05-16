import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Tag, BookMarked, X } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { useMyBookings, useCancelBooking } from './useBookings';
import StatusBadge from '../../shared/components/StatusBadge';
import EmptyState from '../../shared/components/EmptyState';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import { BookingItemSkeleton } from '../../shared/components/Skeleton';
import { formatPrice, formatDate, roomImageUrl, nightsBetween } from '../../shared/lib/format';

/** Fetch chi tiết các phòng đang xuất hiện trong booking list để hiển thị số phòng + type. */
function useRoomMap(roomIds) {
  const [map, setMap] = useState({});
  useEffect(() => {
    if (!roomIds.length) return;
    let alive = true;
    Promise.all(
      roomIds.map((id) =>
        client.get(`/v1/rooms/${id}`).then((r) => [id, r.data.data]).catch(() => [id, null]),
      ),
    ).then((pairs) => {
      if (alive) setMap(Object.fromEntries(pairs.filter(([, v]) => v)));
    });
    return () => { alive = false; };
  }, [roomIds.join('|')]);
  return map;
}

export default function BookingListPage() {
  const { bookings, loading, error, refresh } = useMyBookings();
  const { cancel } = useCancelBooking();

  const roomIds = useMemo(() => [...new Set(bookings.map((b) => b.roomId))], [bookings]);
  const roomMap = useRoomMap(roomIds);

  const [confirming, setConfirming] = useState(null); // booking đang chờ confirm cancel
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirming) return;
    setCancelling(true);
    const result = await cancel(confirming.id);
    setCancelling(false);
    setConfirming(null);
    if (result.ok) {
      toast.success('Đã huỷ booking');
      refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title" style={{ marginBottom: 'var(--space-6)' }}>Bookings của tôi</h1>

      {loading && (
        <div className="booking-list">
          {Array.from({ length: 3 }).map((_, i) => <BookingItemSkeleton key={i} />)}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <EmptyState
          icon={BookMarked}
          title="Chưa có booking nào"
          description="Khi bạn đặt phòng, các booking sẽ hiển thị ở đây."
        />
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="booking-list">
          {bookings.map((b) => {
            const room = roomMap[b.roomId];
            const nights = nightsBetween(b.checkIn, b.checkOut);
            return (
              <article key={b.id} className="booking-item">
                <div
                  className="booking-thumb"
                  style={{ backgroundImage: `url(${roomImageUrl(b.roomId, 200)})` }}
                />
                <div className="booking-info">
                  <div className="name">
                    {room ? `Phòng ${room.roomNumber}` : 'Đang tải...'}
                    {room && <span className="badge badge-muted" style={{ marginLeft: 8 }}>{room.type}</span>}
                  </div>
                  <div className="dates">
                    <CalendarDays size={14} />
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                    <span className="text-muted">· {nights} đêm</span>
                  </div>
                  <div className="total">
                    <Tag size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {formatPrice(b.totalPrice)}
                  </div>
                </div>
                <div className="booking-actions">
                  <StatusBadge status={b.status} />
                  {b.status === 'CONFIRMED' && (
                    <button onClick={() => setConfirming(b)} className="btn btn-danger-outline btn-sm">
                      <X size={14} /> Huỷ booking
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirming)}
        title="Huỷ booking này?"
        description={
          confirming
            ? `Bạn sắp huỷ booking từ ${formatDate(confirming.checkIn)} đến ${formatDate(confirming.checkOut)}. Hành động này không thể hoàn tác.`
            : ''
        }
        confirmLabel="Huỷ booking"
        cancelLabel="Giữ lại"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
