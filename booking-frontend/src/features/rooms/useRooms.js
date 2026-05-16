import { useCallback, useEffect, useState } from 'react';
import client, { extractError } from '../../api/client';

/**
 * Custom hook: load list phòng — có thể "all" hoặc "available trong khoảng ngày".
 *
 * Logic component không nên trực tiếp gọi axios — tách ra hook giúp:
 *   - Reuse giữa nhiều page
 *   - Test dễ hơn (mock 1 hook thay vì axios)
 *   - State (loading/error/data) tập trung 1 chỗ
 */
export function useRooms({ checkIn, checkOut } = {}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = checkIn && checkOut
        ? `/v1/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`
        : `/v1/rooms`;
      const { data } = await client.get(url);
      setRooms(data.data);
    } catch (err) {
      setError(extractError(err).message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refresh: fetchRooms };
}
