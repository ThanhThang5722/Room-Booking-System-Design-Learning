import { useCallback, useEffect, useState } from 'react';
import client, { extractError } from '../../api/client';

/**
 * Hook: list booking của user đang đăng nhập.
 */
export function useMyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get('/v1/bookings/my');
      setBookings(data.data);
    } catch (err) {
      setError(extractError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return { bookings, loading, error, refresh: fetchBookings };
}

/**
 * Map error code từ backend sang message thân thiện cho user.
 * Đây là điểm "UX hóa" — backend trả code khô khan, frontend hiển thị tiếng Việt.
 */
const FRIENDLY_MESSAGES = {
  BOOKING_IN_PROGRESS: 'Phòng này đang được người khác đặt cùng lúc, vui lòng thử lại sau giây lát',
  ROOM_ALREADY_BOOKED: 'Phòng này đã được đặt trong khoảng thời gian bạn chọn, vui lòng chọn phòng/ngày khác',
  ROOM_NOT_FOUND: 'Không tìm thấy phòng',
  INVALID_DATES: 'Ngày nhận/trả phòng không hợp lệ',
  VALIDATION_FAILED: 'Vui lòng kiểm tra lại thông tin',
};

export function friendlyErrorMessage(err) {
  const { code, message } = extractError(err);
  return FRIENDLY_MESSAGES[code] ?? message;
}

/**
 * Hook: tạo booking + handle các loại lỗi 409 đặc thù.
 */
export function useCreateBooking() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const create = async ({ roomId, checkIn, checkOut }) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await client.post('/v1/bookings', { roomId, checkIn, checkOut });
      return { ok: true, booking: data.data };
    } catch (err) {
      const message = friendlyErrorMessage(err);
      setError(message);
      return { ok: false, message };
    } finally {
      setSubmitting(false);
    }
  };

  return { create, submitting, error };
}

export function useCancelBooking() {
  const cancel = async (id) => {
    try {
      await client.delete(`/v1/bookings/${id}`);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: friendlyErrorMessage(err) };
    }
  };
  return { cancel };
}
