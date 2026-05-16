import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Info, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import client, { extractError } from '../../api/client';
import { useAuthStore } from './useAuth';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/rooms';

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await client.post('/v1/auth/login', form);
      loginSuccess(data.data);
      toast.success(`Chào mừng trở lại, ${data.data.fullName}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(extractError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'admin@example.com', password: 'admin123' });
    setErrors({});
  };

  return (
    <div className="form-card fade-in">
      <h2>Đăng nhập</h2>
      <p className="form-sub">Nhập thông tin để tiếp tục đặt phòng</p>

      {serverError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-fields">
          <div className="field">
            <label htmlFor="email" className="field-label">Email</label>
            <div className="field-control">
              <Mail className="field-icon" size={16} />
              <input
                id="email"
                type="email"
                placeholder="ban@example.com"
                value={form.email}
                onChange={setField('email')}
                className={`field-input has-icon ${errors.email ? 'error' : ''}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label">Mật khẩu</label>
            <div className="field-control">
              <Lock className="field-icon" size={16} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={setField('password')}
                className={`field-input has-icon ${errors.password ? 'error' : ''}`}
                autoComplete="current-password"
              />
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 'var(--space-5)' }} disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : (<><LogIn size={16} /> Đăng nhập</>)}
        </button>

        <div className="demo-hint">
          <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            Tài khoản demo: <strong>admin@example.com</strong> / <strong>admin123</strong>
            <button type="button" onClick={fillDemo} className="btn btn-ghost btn-sm" style={{ marginLeft: 6, padding: '2px 8px' }}>
              Điền nhanh
            </button>
          </div>
        </div>
      </form>

      <div className="form-footer">
        Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link>
      </div>
    </div>
  );
}
