import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Production-grade confirm dialog — thay cho window.confirm() (xấu, không style được).
 * - Backdrop click + ESC để đóng
 * - Focus trap đơn giản: auto focus nút confirm khi mở
 * - Animation fade + slide-up
 */
export default function ConfirmDialog({
  open,
  title = 'Xác nhận',
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div
        className="modal-dialog"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="modal-body">
          <h3 id="dialog-title">{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={loading}
            autoFocus
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
