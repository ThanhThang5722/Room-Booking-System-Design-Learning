import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { getRecentRooms, clearRecentRooms } from '../../shared/lib/recentlyViewed';
import { formatPrice, roomImageUrl } from '../../shared/lib/format';

export default function RecentlyViewedStrip() {
  const [items, setItems] = useState([]);

  // Đọc lại mỗi khi component mount — đảm bảo strip refresh sau khi user
  // navigate quay lại từ /book/:roomId
  useEffect(() => {
    setItems(getRecentRooms());
  }, []);

  const handleClear = () => {
    clearRecentRooms();
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <section className="recently-viewed">
      <div className="recently-viewed-header">
        <h3>
          <Clock size={18} /> Xem gần đây
        </h3>
        <button onClick={handleClear} className="btn btn-ghost btn-sm" title="Xoá lịch sử">
          <X size={14} /> Xoá
        </button>
      </div>
      <div className="recently-viewed-scroll">
        {items.map((r) => (
          <Link key={r.id} to={`/book/${r.id}`} className="recently-viewed-item">
            <div
              className="rv-image"
              style={{ backgroundImage: `url(${roomImageUrl(r.id, 300)})` }}
            />
            <div className="rv-body">
              <div className="rv-name">Phòng {r.roomNumber}</div>
              <div className="rv-meta">{r.type} · {formatPrice(r.pricePerNight)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
