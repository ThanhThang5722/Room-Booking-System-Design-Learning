import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Users, Tag, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import client, { extractError } from '../../api/client';
import { useCreateBooking } from './useBookings';
import {
  formatPrice, formatDate, nightsBetween, roomImageUrl, tomorrowISO,
} from '../../shared/lib/format';
import { trackRoomVisit } from '../../shared/lib/recentlyViewed';

export default function BookingFormPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState(null);

  const [form, setForm] = useState({
    checkIn: searchParams.get('checkIn') ?? tomorrowISO(),
    checkOut: searchParams.get('checkOut') ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const { create, submitting, error: createError } = useCreateBooking();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await client.get(`/v1/rooms/${roomId}`);
        if (alive) {
          setRoom(data.data);
          trackRoomVisit(data.data); // ← lưu vào "Xem gần đây"
        }
      } catch (err) {
        if (alive) setRoomError(extractError(err).message);
      } finally {
        if (alive) setLoadingRoom(false);
      }
    })();
    return () => { alive = false; };
  }, [roomId]);

  const nights = useMemo(
    () => nightsBetween(form.checkIn, form.checkOut),
    [form.checkIn, form.checkOut],
  );
  const subtotal = room ? nights * Number(room.pricePerNight) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const minCheckOut = form.checkIn
    ? new Date(new Date(form.checkIn).getTime() + 86_400_000).toISOString().slice(0, 10)
    : today;

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.checkIn) e.checkIn = 'Vui lòng chọn ngày nhận phòng';
    if (!form.checkOut) e.checkOut = 'Vui lòng chọn ngày trả phòng';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      e.checkOut = 'Ngày trả phòng phải sau ngày nhận phòng';
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await create({
      roomId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
    });
    if (result.ok) {
      // Confetti + big checkmark sẽ ở confirmation page → UX tốt hơn toast biến mất.
      navigate(`/bookings/${result.booking.id}/confirmation`, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  if (loadingRoom) {
    return (
      <div className="booking-page fade-in">
        <div className="card">
          <div className="card-body">
            <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 42, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 42 }} />
          </div>
        </div>
        <div className="summary-card">
          <div className="skeleton summary-image" />
          <div className="skeleton" style={{ height: 12, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '60%' }} />
        </div>
      </div>
    );
  }

  if (roomError) return <div className="alert alert-error">{roomError}</div>;
  if (!room) return null;

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={14} /> Quay lại
      </button>

      <div className="booking-page">
        {/* Left column — form */}
        <div className="card">
          <div className="card-body">
            <h2>Đặt phòng {room.roomNumber}</h2>
            <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
              Điền thông tin nhận/trả phòng để xác nhận đặt phòng
            </p>

            {createError && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{createError}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-fields">
                <div className="field">
                  <label className="field-label">Nhận phòng</label>
                  <div className="field-control">
                    <Calendar className="field-icon" size={16} />
                    <input
                      type="date" min={today} value={form.checkIn}
                      onChange={setField('checkIn')}
                      className={`field-input has-icon ${fieldErrors.checkIn ? 'error' : ''}`}
                    />
                  </div>
                  {fieldErrors.checkIn && <div className="field-error">{fieldErrors.checkIn}</div>}
                </div>
                <div className="field">
                  <label className="field-label">Trả phòng</label>
                  <div className="field-control">
                    <Calendar className="field-icon" size={16} />
                    <input
                      type="date" min={minCheckOut} value={form.checkOut}
                      onChange={setField('checkOut')}
                      className={`field-input has-icon ${fieldErrors.checkOut ? 'error' : ''}`}
                    />
                  </div>
                  {fieldErrors.checkOut && <div className="field-error">{fieldErrors.checkOut}</div>}
                </div>
              </div>

              <div className="alert alert-info" style={{ marginTop: 'var(--space-5)', alignItems: 'center' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <div>
                  Hệ thống đảm bảo <strong>không bao giờ</strong> bị đặt trùng phòng — kể cả khi nhiều khách click cùng giây.
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 'var(--space-5)' }} disabled={submitting || nights <= 0}>
                {submitting ? 'Đang xác nhận...' : (
                  <><CheckCircle2 size={18} /> Xác nhận đặt phòng</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right column — summary */}
        <aside className="summary-card">
          <div className="summary-image" style={{ backgroundImage: `url(${roomImageUrl(room.id, 600)})` }} />
          <h3 style={{ marginBottom: 4 }}>Phòng {room.roomNumber}</h3>
          <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
            <span className="badge badge-muted" style={{ marginRight: 6 }}>{room.type}</span>
            <Users size={12} style={{ verticalAlign: 'middle' }} /> {room.capacity} người
          </div>

          <div className="summary-divider" />

          <div className="summary-row">
            <span className="label">Nhận phòng</span>
            <span>{form.checkIn ? formatDate(form.checkIn) : '—'}</span>
          </div>
          <div className="summary-row">
            <span className="label">Trả phòng</span>
            <span>{form.checkOut ? formatDate(form.checkOut) : '—'}</span>
          </div>
          <div className="summary-row">
            <span className="label">Số đêm</span>
            <span>{nights > 0 ? `${nights} đêm` : '—'}</span>
          </div>
          <div className="summary-row">
            <span className="label">Đơn giá</span>
            <span>{formatPrice(room.pricePerNight)}</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-total">
            <span><Tag size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Tổng cộng</span>
            <span className="amount">{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
