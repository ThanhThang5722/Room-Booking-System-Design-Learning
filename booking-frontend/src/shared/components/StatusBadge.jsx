const VARIANTS = {
  CONFIRMED: { label: 'Đã xác nhận',  className: 'badge badge-success' },
  CANCELLED: { label: 'Đã huỷ',       className: 'badge badge-muted' },
  PENDING:   { label: 'Đang xử lý',   className: 'badge badge-warning' },
  FAILED:    { label: 'Thất bại',     className: 'badge badge-danger' },
};

export default function StatusBadge({ status }) {
  const v = VARIANTS[status] ?? { label: status, className: 'badge badge-muted' };
  return (
    <span className={v.className}>
      <span className="badge-dot" />
      {v.label}
    </span>
  );
}
