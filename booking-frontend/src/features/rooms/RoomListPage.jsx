import { useState } from 'react';
import { Calendar, Search, Sparkles, SearchX, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRooms } from './useRooms';
import RoomCard from './RoomCard';
import RecentlyViewedStrip from './RecentlyViewedStrip';
import { RoomGridSkeleton } from '../../shared/components/Skeleton';
import EmptyState from '../../shared/components/EmptyState';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { tomorrowISO, dayAfterTomorrowISO, formatDate } from '../../shared/lib/format';

export default function RoomListPage() {
  // Persisted: lần sau quay lại, dates đã được fill từ search trước.
  const [draft, setDraft] = usePersistedState('booking-search-draft', {
    checkIn: tomorrowISO(),
    checkOut: dayAfterTomorrowISO(),
  });
  const [applied, setApplied] = usePersistedState('booking-search-applied', null);
  const { rooms, loading, error } = useRooms(applied ?? {});

  const handleSearch = (e) => {
    e.preventDefault();
    if (!draft.checkIn || !draft.checkOut) return;
    if (draft.checkOut <= draft.checkIn) {
      toast.error('Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }
    setApplied(draft);
  };

  const handleClear = () => setApplied(null);

  const today = new Date().toISOString().slice(0, 10);
  const minCheckOut = draft.checkIn
    ? new Date(new Date(draft.checkIn).getTime() + 86_400_000).toISOString().slice(0, 10)
    : today;

  return (
    <div className="page-transition">
      <section className="hero">
        <div className="hero-eyebrow">
          <Sparkles size={14} /> Đặt phòng an toàn, không bị trùng
        </div>
        <h1>Tìm không gian nghỉ dưỡng hoàn hảo cho chuyến đi của bạn</h1>
        <p>Hệ thống đảm bảo concurrent-safe — dù hàng trăm khách đặt cùng lúc, mỗi phòng chỉ thuộc về 1 người.</p>
      </section>

      <form onSubmit={handleSearch} className="search-bar">
        <div className="field">
          <label className="field-label">Nhận phòng</label>
          <div className="field-control">
            <Calendar className="field-icon" size={16} />
            <input
              type="date" min={today} value={draft.checkIn}
              onChange={(e) => setDraft({ ...draft, checkIn: e.target.value })}
              className="field-input has-icon"
            />
          </div>
        </div>
        <div className="field">
          <label className="field-label">Trả phòng</label>
          <div className="field-control">
            <Calendar className="field-icon" size={16} />
            <input
              type="date" min={minCheckOut} value={draft.checkOut}
              onChange={(e) => setDraft({ ...draft, checkOut: e.target.value })}
              className="field-input has-icon"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg">
          <Search size={16} /> Tìm phòng
        </button>
        {applied && (
          <button type="button" onClick={handleClear} className="btn btn-secondary btn-lg" title="Xem tất cả">
            <RotateCcw size={16} />
          </button>
        )}
      </form>

      <RecentlyViewedStrip />

      <div className="section-title">
        <h2>
          {applied
            ? `Phòng trống từ ${formatDate(applied.checkIn)} → ${formatDate(applied.checkOut)}`
            : 'Tất cả phòng'}
        </h2>
        {!loading && !error && (
          <span className="meta">{rooms.length} kết quả</span>
        )}
      </div>

      {loading && <RoomGridSkeleton count={6} />}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && rooms.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Không có phòng phù hợp"
          description="Thử thay đổi khoảng ngày hoặc bỏ filter để xem tất cả phòng."
          action={applied && (
            <button onClick={handleClear} className="btn btn-secondary">
              <RotateCcw size={14} /> Xem tất cả phòng
            </button>
          )}
        />
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="room-grid">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} searchRange={applied} />
          ))}
        </div>
      )}
    </div>
  );
}
