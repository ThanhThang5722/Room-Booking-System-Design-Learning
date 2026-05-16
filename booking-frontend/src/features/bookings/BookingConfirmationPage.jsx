import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Tag, Hash, ArrowRight, BookMarked } from 'lucide-react';
import confetti from 'canvas-confetti';
import client, { extractError } from '../../api/client';
import { formatDate, formatPrice, nightsBetween, roomImageUrl } from '../../shared/lib/format';

/**
 * Fire confetti từ 2 góc dưới — pattern phổ biến của Stripe Checkout success page.
 * Respect prefers-reduced-motion → không bắn nếu user tắt animation.
 */
function fireConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const end = Date.now() + 900;
  const colors = ['#6366f1', '#10b981', '#f59e0b'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.85 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.85 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fireConfetti();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: bRes } = await client.get(`/v1/bookings/${id}`);
        if (!alive) return;
        const b = bRes.data;
        setBooking(b);
        const { data: rRes } = await client.get(`/v1/rooms/${b.roomId}`);
        if (alive) setRoom(rRes.data);
      } catch (err) {
        if (alive) setError(extractError(err).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="skeleton" style={{ height: 96, width: 96, borderRadius: '50%', margin: '0 auto 24px' }} />
        <div className="skeleton" style={{ height: 28, width: '60%', margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ height: 14, width: '80%', margin: '0 auto' }} />
      </div>
    );
  }

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!booking) return null;

  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return (
    <div className="confirmation-page">
      <div className="success-icon-wrap">
        <CheckCircle2 size={56} color="var(--c-success-700)" strokeWidth={2} />
      </div>

      <h1 style={{ marginBottom: 8 }}>Đặt phòng thành công!</h1>
      <p className="text-muted">
        Cảm ơn bạn đã đặt phòng. Mọi thông tin chi tiết đã được lưu trong tài khoản.
      </p>

      <div className="confirmation-card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div
            style={{
              width: 80, height: 80, borderRadius: 'var(--r-md)',
              backgroundImage: `url(${roomImageUrl(booking.roomId, 200)})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              flexShrink: 0,
            }}
          />
          <div>
            <h3 style={{ marginBottom: 4 }}>
              {room ? `Phòng ${room.roomNumber}` : 'Phòng'}
            </h3>
            {room && (
              <span className="badge badge-muted">{room.type}</span>
            )}
          </div>
        </div>

        <div className="summary-divider" />

        <div className="summary-row">
          <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Hash size={14} /> Mã booking
          </span>
          <span className="confirmation-id">{booking.id}</span>
        </div>
        <div className="summary-row">
          <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} /> Thời gian
          </span>
          <span>
            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ({nights} đêm)
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-total">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Tag size={16} /> Tổng thanh toán
          </span>
          <span className="amount">{formatPrice(booking.totalPrice)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to="/my-bookings" className="btn btn-primary">
          <BookMarked size={16} /> Xem bookings của tôi
        </Link>
        <Link to="/rooms" className="btn btn-secondary">
          Tiếp tục đặt phòng <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
