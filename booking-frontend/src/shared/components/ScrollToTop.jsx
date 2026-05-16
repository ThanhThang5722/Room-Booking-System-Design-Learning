import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Mỗi lần navigate, cuộn về đầu page.
 *
 * Mặc định SPA giữ scroll position — user sẽ thấy lạ khi từ trang dài đầy bookings
 * click sang trang ngắn mà bị stuck ở giữa. Pattern này là chuẩn UX cho SPA.
 *
 * Bỏ qua nếu URL có hash (#section) — user đang muốn jump tới anchor cụ thể.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
