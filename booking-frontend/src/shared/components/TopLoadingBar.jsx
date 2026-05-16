import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Top loading bar — animation kiểu YouTube/GitHub khi navigate route.
 *
 * 📚 Vì sao có bar này?
 *   - Route change ở SPA không re-render full page → user dễ "lạc",
 *     không biết click đã có effect hay chưa.
 *   - Loading bar tạo "perceived performance" — user thấy hệ thống đang
 *     làm việc, dù tốc độ thực tế không đổi.
 *
 * Cách hoạt động:
 *   - Path đổi → progress nhảy lên 30% → 70% → 90% theo từng tick.
 *   - Khi component re-mount (path mới đã ổn định) → progress về 100% → ẩn.
 */
export default function TopLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(20);

    const t1 = setTimeout(() => setProgress(60), 80);
    const t2 = setTimeout(() => setProgress(85), 220);
    const t3 = setTimeout(() => setProgress(100), 380);
    const t4 = setTimeout(() => setVisible(false), 600);
    const t5 = setTimeout(() => setProgress(0), 700);

    return () => {
      [t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="top-loading-bar"
      style={{ '--progress': `${progress}%` }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    />
  );
}
