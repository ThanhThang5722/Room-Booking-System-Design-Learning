import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth store dùng Zustand + persist middleware.
 *
 * 📚 Vì sao persist vào localStorage?
 *   - Refresh page không bị logout.
 *   - Trade-off: token nằm ở localStorage → tổn thương trước XSS. Production
 *     nên dùng httpOnly cookie + CSRF token, nhưng setup phức tạp hơn.
 *   - Cho UC demo này: localStorage chấp nhận được.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      loginSuccess: ({ accessToken, userId, email, fullName, role }) =>
        set({
          token: accessToken,
          user: { id: userId, email, fullName, role },
        }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'booking-auth',
    },
  ),
);

/** Helper hook: thông tin user + cờ đã login */
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'ADMIN',
  };
}
