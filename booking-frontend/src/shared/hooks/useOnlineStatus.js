import { useEffect, useState } from 'react';

/**
 * Track network online/offline status.
 * Browser fire 'online' và 'offline' events trên window.
 * 📚 Lưu ý: navigator.onLine không 100% reliable (chỉ check NIC, không ping).
 *   Production sẽ kết hợp với health check API. Đủ tốt cho client-side feedback.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  return online;
}
