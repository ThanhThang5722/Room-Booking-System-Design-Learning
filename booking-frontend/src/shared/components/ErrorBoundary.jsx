import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * React ErrorBoundary — bắt mọi crash trong render tree, hiển thị fallback UI
 * thay vì để app whitescreen.
 *
 * Production: send error tới Sentry/Datadog ở componentDidCatch.
 *
 * Lưu ý: ErrorBoundary BẮT BUỘC phải là class component (React API).
 *   Hooks không hỗ trợ catch render error.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
    // Production: window.Sentry?.captureException(error, { contexts: { react: info } });
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="notfound-page">
        <div className="empty-state-icon" style={{ width: 80, height: 80 }}>
          <AlertTriangle size={36} strokeWidth={1.5} />
        </div>
        <h2>Đã có lỗi xảy ra</h2>
        <p>Trang gặp lỗi không mong muốn. Hãy thử tải lại — nếu vẫn lỗi, vui lòng liên hệ admin.</p>
        <button onClick={this.handleReset} className="btn btn-primary">
          <RotateCcw size={16} /> Tải lại trang
        </button>
        {import.meta.env.DEV && (
          <pre style={{
            marginTop: 24, textAlign: 'left',
            padding: 16, background: 'var(--c-slate-100)',
            borderRadius: 8, fontSize: 12, color: 'var(--c-danger-700)',
            overflow: 'auto',
          }}>
            {String(this.state.error?.stack ?? this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
