const KEY = 'booking-recently-viewed';
const MAX = 5;

/**
 * Quản lý "recently viewed rooms" — lưu trong localStorage.
 * Dedup theo id, giữ thứ tự "mới nhất trước", giới hạn MAX item.
 */

export function getRecentRooms() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function trackRoomVisit(room) {
  if (!room?.id) return;
  try {
    const existing = getRecentRooms().filter((r) => r.id !== room.id);
    const entry = {
      id: room.id,
      roomNumber: room.roomNumber,
      type: room.type,
      pricePerNight: room.pricePerNight,
      viewedAt: Date.now(),
    };
    const next = [entry, ...existing].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (_) {}
}

export function clearRecentRooms() {
  try { localStorage.removeItem(KEY); } catch (_) {}
}
