export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state fade-in">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={28} strokeWidth={1.5} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}
