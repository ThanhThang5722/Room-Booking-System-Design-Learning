import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import client, { extractError } from '../../api/client';
import { useAuthStore } from './useAuth';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const navigate = useNavigate();

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await client.post('/v1/auth/register', form);
      loginSuccess(data.data);
      toast.success('Tạo tài khoản thành công!');
      navigate('/rooms', { replace: true });
    } catch (err) {
      setServerError(extractError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card fade-in">
      <h2>Tạo tài khoản</h2>
      <p className="form-sub">Đăng ký để bắt đầu đặt phòng</p>

      {serverError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-fields">
          <div className="field">
            <label htmlFor="email" className="field-label">Email</label>
            <div className="field-control">
              <Mail className="field-icon" size={16} />
              <input
                id="email" type="email" placeholder="ban@example.com"
                value={form.email} onChange={setField('email')}
                className={`field-input has-icon ${errors.email ? 'error' : ''}`}
                autoComplete="email"
              />
            </div>
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="fullName" className="field-label">Họ và tên</label>
            <div className="field-control">
              <User className="field-icon" size={16} />
              <input
                id="fullName" type="text" placeholder="Nguyễn Văn A"
                value={form.fullName} onChange={setField('fullName')}
                className={`field-input has-icon ${errors.fullName ? 'error' : ''}`}
                autoComplete="name"
              />
            </div>
            {errors.fullName && <div className="field-error">{errors.fullName}</div>}
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label">Mật khẩu</label>
            <div className="field-control">
              <Lock className="field-icon" size={16} />
              <input
                id="password" type="password" placeholder="••••••••"
                value={form.password} onChange={setField('password')}
                className={`field-input has-icon ${errors.password ? 'error' : ''}`}
                autoComplete="new-password"
              />
            </div>
            {errors.password
              ? <div className="field-error">{errors.password}</div>
              : <div className="field-hint">Tối thiểu 6 ký tự</div>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 'var(--space-5)' }} disabled={submitting}>
          {submitting ? 'Đang tạo tài khoản...' : (<><UserPlus size={16} /> Tạo tài khoản</>)}
        </button>
      </form>

      <div className="form-footer">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </div>
    </div>
  );
}
