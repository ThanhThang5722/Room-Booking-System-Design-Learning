import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="notfound-page">
      <div className="notfound-code">404</div>
      <h2>Trang không tồn tại</h2>
      <p>
        Đường dẫn bạn vừa truy cập không có trong hệ thống.
        Có thể link đã hết hạn hoặc bạn gõ sai địa chỉ.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={16} /> Về trang chủ
        </Link>
        <Link to="/rooms" className="btn btn-secondary">
          <Search size={16} /> Xem danh sách phòng
        </Link>
      </div>
    </div>
  );
}
