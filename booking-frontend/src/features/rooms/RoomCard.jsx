import { Link } from 'react-router-dom';
import { Users, ArrowRight, LogIn, Flame } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { formatPrice, roomImageUrl } from '../../shared/lib/format';
import LazyImage from '../../shared/components/LazyImage';

/**
 * Social proof badge — deterministic theo room.id.
 * Production sẽ lấy data thật từ analytics (số người đang xem,
 * số booking gần đây), nhưng pattern này quan trọng cho conversion:
 * giúp user thấy phòng "đang hot" → tâm lý FOMO.
 */
function socialProofMessage(roomId) {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) hash = ((hash << 5) - hash + roomId.charCodeAt(i)) | 0;
  hash = Math.abs(hash);

  const minutes = (hash % 25) + 3;            // 3-27 phút
  const viewers = (hash % 8) + 2;             // 2-9 người
  const variant = hash % 4;

  if (variant === 0) return { icon: Flame, text: `${viewers} người đang xem` };
  if (variant === 1) return { icon: Flame, text: `Đặt ${minutes} phút trước` };
  if (variant === 2) return { icon: Flame, text: `Còn 2 phòng cuối` };
  return null;                                 // 25% phòng không có badge
}

export default function RoomCard({ room, searchRange }) {
  const { isAuthenticated } = useAuth();

  const bookLink = searchRange
    ? `/book/${room.id}?checkIn=${searchRange.checkIn}&checkOut=${searchRange.checkOut}`
    : `/book/${room.id}`;

  const proof = socialProofMessage(room.id);

  return (
    <article className="room-card">
      <div className="image" style={{ position: 'relative', aspectRatio: '4 / 3' }}>
        <LazyImage
          src={roomImageUrl(room.id, 600)}
          alt={`Phòng ${room.roomNumber}`}
          style={{ position: 'absolute', inset: 0 }}
        />
        <span className="type-badge">{room.type}</span>
        {proof && (
          <span className="social-proof">
            <proof.icon size={11} /> {proof.text}
          </span>
        )}
        <span className="room-no">Phòng {room.roomNumber}</span>
      </div>
      <div className="body">
        <p className="description">{room.description ?? 'Phòng tiện nghi, sạch sẽ, view đẹp.'}</p>
        <div className="meta">
          <span className="meta-item"><Users size={14} /> {room.capacity} người</span>
        </div>
        <div className="footer">
          <div className="price">
            <div className="amount">{formatPrice(room.pricePerNight)}</div>
            <div className="unit">/ đêm</div>
          </div>
          {isAuthenticated ? (
            <Link to={bookLink} className="btn btn-primary btn-sm">
              Đặt ngay <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/login" state={{ from: bookLink }} className="btn btn-secondary btn-sm">
              <LogIn size={14} /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
