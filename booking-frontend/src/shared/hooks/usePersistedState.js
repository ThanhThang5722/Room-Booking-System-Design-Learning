import { useEffect, useState } from 'react';

/**
 * Như useState nhưng tự động sync với localStorage.
 * Dùng cho: search filters, draft form data, preference toggles, v.v.
 *
 * 📚 Why: user mở lại app/F5 → vẫn giữ ngày đã search trước đó.
 *   Trải nghiệm này nhỏ nhưng feel pro — Airbnb, Google Flights đều làm.
 */
export function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (_) {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_) {
      // Quota exceeded, privacy mode, ... → bỏ qua, không phá flow
    }
  }, [key, state]);

  return [state, setState];
}
