import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../features/auth/useAuth';

/**
 * Axios instance dùng chung toàn app.
 * - baseURL "/api" → Vite dev proxy chuyển sang http://localhost:8080
 * - Request interceptor: tự đính kèm Authorization: Bearer <token> nếu đã login
 * - Response interceptor: nếu 401 → logout + redirect login (với message rõ ràng)
 */
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let redirectingToLogin = false;

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Token expired / invalid → logout, kick về login.
    // Dùng flag để tránh nhiều request fail cùng lúc → multiple toast/redirect.
    if (status === 401 && !redirectingToLogin) {
      redirectingToLogin = true;
      useAuthStore.getState().logout();
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      setTimeout(() => {
        const here = window.location.pathname + window.location.search;
        const isOnAuthPage = ['/login', '/register'].some((p) => here.startsWith(p));
        if (!isOnAuthPage) {
          window.location.href = `/login?from=${encodeURIComponent(here)}`;
        }
        redirectingToLogin = false;
      }, 300);
    }

    return Promise.reject(error);
  },
);

/**
 * Trích error code + message từ axios error.
 * Phân biệt rõ network-down vs response không có error body vs status cụ thể.
 */
export function extractError(error) {
  // Không có response → network thực sự down
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối tới server. Kiểm tra mạng hoặc backend đã chạy chưa.',
    };
  }

  const { status, data } = error.response;

  // Backend trả đúng format ApiResponse.fail(code, message)
  if (data?.error) {
    return { code: data.error.code, message: data.error.message };
  }

  // Fallback theo HTTP status — đề phòng response body lạ
  if (status === 401) return { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập đã hết hạn' };
  if (status === 403) return { code: 'FORBIDDEN',    message: 'Bạn không có quyền thực hiện thao tác này' };
  if (status === 404) return { code: 'NOT_FOUND',    message: 'Không tìm thấy tài nguyên' };
  if (status === 409) return { code: 'CONFLICT',     message: 'Xung đột dữ liệu, vui lòng thử lại' };
  if (status >= 500)  return { code: 'SERVER_ERROR', message: `Server gặp sự cố (HTTP ${status})` };

  return { code: 'UNKNOWN', message: `Lỗi không xác định (HTTP ${status})` };
}

export default client;
