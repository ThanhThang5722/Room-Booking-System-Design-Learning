/**
 * Format helpers — gom tất cả vào 1 chỗ để consistent toàn app.
 * Khi muốn đổi locale/currency, chỉ sửa ở đây.
 */

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const SHORT_DATE = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
const RELATIVE = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });

export const formatPrice = (n) => VND.format(Number(n ?? 0));

export const formatDate = (iso) => {
  if (!iso) return '—';
  return SHORT_DATE.format(new Date(iso));
};

/** "2026-06-01" → tomorrow / "trong 3 ngày" / ... */
export const formatRelativeDate = (iso) => {
  if (!iso) return '—';
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86_400_000);
  return RELATIVE.format(days, 'day');
};

export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(0, Math.round((b - a) / 86_400_000));
};

export const toDateInput = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

export const tomorrowISO = () => toDateInput(new Date(Date.now() + 86_400_000));
export const dayAfterTomorrowISO = () => toDateInput(new Date(Date.now() + 2 * 86_400_000));

/**
 * Deterministic hotel-room image URL theo room.id.
 * Production sẽ dùng asset thật từ CMS/CDN — đây chỉ là placeholder.
 */
const ROOM_PHOTOS = [
  'photo-1631049307264-da0ec9d70304',
  'photo-1566073771259-6a8506099945',
  'photo-1611892440504-42a792e24d32',
  'photo-1582719508461-905c673771fd',
  'photo-1590490360182-c33d57733427',
  'photo-1564501049412-61c2a3083791',
  'photo-1631049552057-403cdb8f0658',
  'photo-1578683010236-d716f9a3f461',
];

const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const roomImageUrl = (roomId, w = 600) => {
  const photo = ROOM_PHOTOS[hashStr(String(roomId ?? '')) % ROOM_PHOTOS.length];
  return `https://images.unsplash.com/${photo}?w=${w}&q=80&auto=format&fit=crop`;
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
